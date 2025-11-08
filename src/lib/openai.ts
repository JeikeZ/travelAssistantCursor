import OpenAI from 'openai'
import { TripData, PackingItem, AppError } from '@/types'

// Retry helper with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on certain errors
      if (error instanceof PackingListError) {
        const nonRetryableCodes = ['API_KEY_MISSING', 'API_KEY_INVALID', 'INVALID_INPUT', 'PARSE_ERROR']
        if (nonRetryableCodes.includes(error.code)) {
          throw error
        }
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = initialDelay * Math.pow(2, attempt) + Math.random() * 1000
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms delay`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError || new Error('Max retries exceeded')
}

// Factory function to create OpenAI client on-demand
// This is better for serverless environments than singleton pattern
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    throw new PackingListError(
      'OpenAI API key is not configured. Please add your API key to environment variables.',
      'API_KEY_MISSING'
    )
  }

  try {
    return new OpenAI({
      apiKey,
      timeout: 30000, // 30 seconds - more lenient timeout for reliability
      maxRetries: 3,   // Increased retries with exponential backoff for better reliability
      // OpenAI SDK handles exponential backoff automatically
      dangerouslyAllowBrowser: false,
    })
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error)
    throw new PackingListError(
      'Failed to initialize OpenAI service',
      'SERVICE_INIT_FAILED'
    )
  }
}

export class PackingListError extends AppError {
  constructor(message: string, code: string) {
    super(message, code, 500)
    this.name = 'PackingListError'
  }
}

export async function generatePackingList(tripData: TripData): Promise<PackingItem[]> {
  try {
    // Get fresh client instance (better for serverless)
    const client = getOpenAIClient()

    // Validate input
    if (!tripData.destinationCountry || !tripData.destinationCity || !tripData.duration || !tripData.tripType) {
      throw new PackingListError('Missing required trip information', 'INVALID_INPUT')
    }

    const locationString = tripData.destinationDisplayName || `${tripData.destinationCity}, ${tripData.destinationCountry}`
    const prompt = `Generate a comprehensive packing list for a ${tripData.duration}-day ${tripData.tripType} trip to ${locationString}.

Return a JSON object with an "items" array. Each item should have this structure:
{
  "name": "Item name",
  "category": "clothing|toiletries|electronics|travel_documents|medication|miscellaneous",
  "essential": true/false (true for items like passport, medication, phone charger)
}

Consider:
- Local climate and weather conditions
- Cultural customs and dress codes
- Trip duration and type
- Essential travel documents
- Electronics and chargers
- Health and safety items
- Country-specific restrictions or requirements

Categories should be:
- clothing: All wearable items
- toiletries: Personal care items
- electronics: Tech items, chargers, adapters
- travel_documents: Passport, visa, tickets, insurance
- medication: Health-related items
- miscellaneous: Everything else

Mark items as essential if they are critical for travel (passport, medication, phone, charger, etc.) or could be very difficult to replace at the destination.

Return in this format: {"items": [...]}`

    // Use JSON mode for more reliable, structured responses
    // Wrap in retry logic for additional reliability
    const response = await retryWithBackoff(async () => {
      return await client.chat.completions.create({
        model: 'gpt-3.5-turbo-1106', // Supports JSON mode
        messages: [
          {
            role: 'system',
            content: 'You are a helpful travel assistant that generates comprehensive, location-specific packing lists. Always respond with valid JSON only. Ensure the response is an array of objects with name, category, and essential fields.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' }, // Enforce JSON response
        temperature: 0.7,
        max_tokens: 2000,
        seed: 42, // Consistent results for same inputs (helps with caching)
      })
    }, 2, 1000) // 2 retries at application level (on top of SDK's 3 retries)

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) {
      throw new PackingListError('Empty response from AI service', 'EMPTY_RESPONSE')
    }

    // Parse the JSON response with better error handling
    let items: Omit<PackingItem, 'id' | 'packed' | 'custom'>[]
    try {
      const parsed = JSON.parse(content)
      
      // Handle both array and object with items array
      let itemsArray = Array.isArray(parsed) ? parsed : parsed.items || parsed.packingList || []
      
      if (!Array.isArray(itemsArray) || itemsArray.length === 0) {
        throw new Error('Response does not contain a valid items array')
      }
      
      // Validate each item
      items = itemsArray.map((item, index) => {
        if (typeof item !== 'object' || !item.name || !item.category) {
          throw new Error(`Invalid item at index ${index}`)
        }
        
        // Validate category is one of the allowed values
        const validCategories = ['clothing', 'toiletries', 'electronics', 'travel_documents', 'medication', 'miscellaneous']
        const category = String(item.category)
        if (!validCategories.includes(category)) {
          console.warn(`Invalid category "${category}" at index ${index}, defaulting to "miscellaneous"`)
        }
        
        return {
          name: String(item.name),
          category: validCategories.includes(category) ? category as PackingItem['category'] : 'miscellaneous',
          essential: item.essential === true || item.essential === 'true'
        }
      })
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content)
      console.error('Parse error:', parseError)
      throw new PackingListError('Invalid response format from AI service', 'PARSE_ERROR')
    }

    // Add IDs and default properties
    const packingList: PackingItem[] = items.map((item, index) => ({
      id: `item-${index}`,
      ...item,
      packed: false,
      custom: false,
    }))

    if (packingList.length === 0) {
      throw new PackingListError('AI service returned empty packing list', 'EMPTY_LIST')
    }

    return packingList
  } catch (error) {
    // Enhanced error logging for debugging
    console.error('Error generating packing list:', {
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      hasApiKey: !!process.env.OPENAI_API_KEY,
      apiKeyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) + '...' : 'NOT_SET',
      tripData: {
        country: tripData.destinationCountry,
        city: tripData.destinationCity,
        duration: tripData.duration,
        type: tripData.tripType
      }
    })
    
    // Re-throw PackingListError as-is
    if (error instanceof PackingListError) {
      throw error
    }
    
    // Handle OpenAI specific errors
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      
      // Check for specific OpenAI error patterns
      if (errorMessage.includes('api key') || errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
        throw new PackingListError('Invalid OpenAI API key', 'API_KEY_INVALID')
      }
      if (errorMessage.includes('timeout') || errorMessage.includes('timed out') || errorMessage.includes('etimedout')) {
        throw new PackingListError('OpenAI request timed out - service may be experiencing high load', 'TIMEOUT')
      }
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        throw new PackingListError('OpenAI rate limit exceeded - please try again in a moment', 'RATE_LIMIT')
      }
      if (errorMessage.includes('insufficient_quota') || errorMessage.includes('quota') || errorMessage.includes('billing')) {
        throw new PackingListError('OpenAI account has insufficient credits', 'INSUFFICIENT_QUOTA')
      }
      if (errorMessage.includes('econnrefused') || errorMessage.includes('enotfound') || errorMessage.includes('network')) {
        throw new PackingListError('Network connection error - please check your internet connection', 'NETWORK_ERROR')
      }
      if (errorMessage.includes('503') || errorMessage.includes('service unavailable')) {
        throw new PackingListError('OpenAI service temporarily unavailable - please try again', 'SERVICE_UNAVAILABLE')
      }
      if (errorMessage.includes('502') || errorMessage.includes('bad gateway')) {
        throw new PackingListError('OpenAI gateway error - please try again', 'GATEWAY_ERROR')
      }
      
      // Generic error wrapping with more context
      throw new PackingListError(`OpenAI API error: ${error.message}`, 'OPENAI_ERROR')
    }
    
    // Fallback for completely unknown errors
    throw new PackingListError('Unknown error occurred', 'UNKNOWN_ERROR')
  }
}