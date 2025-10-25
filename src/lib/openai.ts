import OpenAI from 'openai'
import { TripData, PackingItem, AppError } from '@/types'

// Create a new OpenAI client instance for each request (serverless-friendly)
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    console.error('OPENAI_API_KEY environment variable is not set')
    throw new PackingListError(
      'OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.',
      'API_KEY_MISSING'
    )
  }

  console.log('Creating OpenAI client with API key:', apiKey.substring(0, 7) + '...')
  
  try {
    return new OpenAI({
      apiKey: apiKey,
      timeout: 35000, // 35 seconds - increased for better reliability
      maxRetries: 3, // Increased retries
    })
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error)
    throw new PackingListError(
      'Failed to initialize OpenAI service',
      'CLIENT_INIT_FAILED'
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
  console.log('Starting packing list generation for:', {
    destination: `${tripData.destinationCity}, ${tripData.destinationCountry}`,
    duration: tripData.duration,
    tripType: tripData.tripType
  })
  
  try {
    const client = getOpenAIClient()

    // Validate input
    if (!tripData.destinationCountry || !tripData.destinationCity || !tripData.duration || !tripData.tripType) {
      throw new PackingListError('Missing required trip information', 'INVALID_INPUT')
    }

    const locationString = tripData.destinationDisplayName || `${tripData.destinationCity}, ${tripData.destinationCountry}`
    const prompt = `Generate a comprehensive packing list for a ${tripData.duration}-day ${tripData.tripType} trip to ${locationString}.

Please return a JSON array of items with the following structure for each item:
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

Return only the JSON array, no additional text.`

    console.log('Sending request to OpenAI...')
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Using gpt-4o-mini for better reliability and cost-effectiveness
      messages: [
        {
          role: 'system',
          content: 'You are a helpful travel assistant that generates comprehensive, location-specific packing lists. CRITICAL: You must respond with a valid JSON array ONLY. Do not include any markdown formatting, code blocks, or explanatory text. Return ONLY the raw JSON array of objects with name, category, and essential fields.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000, // Increased for longer trips
      response_format: { type: 'json_object' }, // Force JSON response
    })
    
    console.log('Received response from OpenAI:', {
      finishReason: response.choices[0]?.finish_reason,
      hasContent: !!response.choices[0]?.message?.content,
      usage: response.usage
    })

    // Validate response structure
    if (!response.choices || response.choices.length === 0) {
      throw new PackingListError('No choices in OpenAI response', 'INVALID_RESPONSE')
    }

    const choice = response.choices[0]
    
    // Check finish reason
    if (choice.finish_reason !== 'stop') {
      console.warn('OpenAI response did not finish normally:', choice.finish_reason)
      if (choice.finish_reason === 'length') {
        throw new PackingListError('Response was cut off due to length limit', 'RESPONSE_TOO_LONG')
      }
      if (choice.finish_reason === 'content_filter') {
        throw new PackingListError('Content was filtered by OpenAI', 'CONTENT_FILTERED')
      }
    }

    const content = choice.message?.content?.trim()
    if (!content) {
      throw new PackingListError('Empty response from AI service', 'EMPTY_RESPONSE')
    }

    console.log('Raw OpenAI response (first 200 chars):', content.substring(0, 200))

    // Parse the JSON response with better error handling
    let items: Omit<PackingItem, 'id' | 'packed' | 'custom'>[]
    try {
      // Remove potential markdown code blocks that OpenAI sometimes adds
      const sanitizedContent = content
        .replace(/^```json\s*/i, '')  // Remove opening ```json
        .replace(/^```\s*/i, '')       // Remove opening ```
        .replace(/\s*```$/i, '')       // Remove closing ```
        .trim()
      
      console.log('Sanitized content (first 200 chars):', sanitizedContent.substring(0, 200))
      
      const parsed = JSON.parse(sanitizedContent)
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array')
      }
      
      // Validate each item
      items = parsed.map((item, index) => {
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
          essential: Boolean(item.essential)
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
    console.error('Error generating packing list:', error)
    
    // Re-throw PackingListError as-is
    if (error instanceof PackingListError) {
      throw error
    }
    
    // Handle OpenAI-specific errors
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      
      // Check for specific OpenAI error types
      if (errorMessage.includes('api key') || errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
        throw new PackingListError(
          'Invalid or missing OpenAI API key. Please check your API key configuration.',
          'INVALID_API_KEY'
        )
      }
      
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        throw new PackingListError(
          'OpenAI rate limit exceeded. Please try again in a moment.',
          'RATE_LIMIT_EXCEEDED'
        )
      }
      
      if (errorMessage.includes('quota') || errorMessage.includes('insufficient_quota')) {
        throw new PackingListError(
          'OpenAI quota exceeded. Please check your billing settings.',
          'QUOTA_EXCEEDED'
        )
      }
      
      if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        throw new PackingListError(
          'Request to OpenAI timed out. Please try again.',
          'TIMEOUT'
        )
      }
      
      if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        throw new PackingListError(
          'Network error connecting to OpenAI. Please check your connection.',
          'NETWORK_ERROR'
        )
      }
      
      // Generic error
      console.error('Unexpected error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3)
      })
      
      throw new PackingListError(
        `Failed to generate packing list: ${error.message}`,
        'GENERATION_FAILED'
      )
    }
    
    // Fallback for completely unknown errors
    console.error('Unknown error type:', error)
    throw new PackingListError(
      'An unexpected error occurred while generating your packing list.',
      'UNKNOWN_ERROR'
    )
  }
}

function getDefaultPackingList(): PackingItem[] {
  const essentialItems: Omit<PackingItem, 'id' | 'packed' | 'custom'>[] = [
    { name: 'Passport', category: 'travel_documents', essential: true },
    { name: 'Travel Insurance', category: 'travel_documents', essential: true },
    { name: 'Phone Charger', category: 'electronics', essential: true },
    { name: 'Medications', category: 'medication', essential: true },
    { name: 'Wallet/Credit Cards', category: 'miscellaneous', essential: true },
  ]

  const clothingItems: Omit<PackingItem, 'id' | 'packed' | 'custom'>[] = [
    { name: 'Underwear', category: 'clothing', essential: false },
    { name: 'Socks', category: 'clothing', essential: false },
    { name: 'T-shirts', category: 'clothing', essential: false },
    { name: 'Pants/Jeans', category: 'clothing', essential: false },
    { name: 'Pajamas', category: 'clothing', essential: false },
  ]

  const toiletryItems: Omit<PackingItem, 'id' | 'packed' | 'custom'>[] = [
    { name: 'Toothbrush', category: 'toiletries', essential: false },
    { name: 'Toothpaste', category: 'toiletries', essential: false },
    { name: 'Shampoo', category: 'toiletries', essential: false },
    { name: 'Deodorant', category: 'toiletries', essential: false },
  ]

  const electronicItems: Omit<PackingItem, 'id' | 'packed' | 'custom'>[] = [
    { name: 'Phone', category: 'electronics', essential: true },
    { name: 'Camera', category: 'electronics', essential: false },
    { name: 'Power Bank', category: 'electronics', essential: false },
  ]

  const allItems = [
    ...essentialItems,
    ...clothingItems,
    ...toiletryItems,
    ...electronicItems,
  ]

  return allItems.map((item, index) => ({
    id: `fallback-${index}`,
    ...item,
    packed: false,
    custom: false,
  }))
}