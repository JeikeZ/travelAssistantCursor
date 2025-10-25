import OpenAI from 'openai'
import { TripData, PackingItem, AppError } from '@/types'

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
      timeout: 25000, // 25 seconds - slightly less than Vercel timeout
      maxRetries: 1,   // Reduce retries to avoid timeout issues
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

    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
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
      temperature: 0.7,
      max_tokens: 2000,
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) {
      throw new PackingListError('Empty response from AI service', 'EMPTY_RESPONSE')
    }

    // Parse the JSON response with better error handling
    let items: Omit<PackingItem, 'id' | 'packed' | 'custom'>[]
    try {
      const parsed = JSON.parse(content)
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
      // Check for specific OpenAI error patterns
      if (error.message.includes('API key')) {
        throw new PackingListError('Invalid OpenAI API key', 'API_KEY_INVALID')
      }
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        throw new PackingListError('OpenAI request timed out', 'TIMEOUT')
      }
      if (error.message.includes('rate limit')) {
        throw new PackingListError('OpenAI rate limit exceeded', 'RATE_LIMIT')
      }
      if (error.message.includes('insufficient_quota')) {
        throw new PackingListError('OpenAI account has insufficient credits', 'INSUFFICIENT_QUOTA')
      }
      
      // Generic error wrapping
      throw new PackingListError(`OpenAI API error: ${error.message}`, 'OPENAI_ERROR')
    }
    
    // Fallback for completely unknown errors
    throw new PackingListError('Unknown error occurred', 'UNKNOWN_ERROR')
  }
}

// Fallback packing list is no longer used in production
// Kept for reference or emergency use only
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