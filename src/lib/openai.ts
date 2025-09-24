import OpenAI from 'openai'

let openai: OpenAI | null = null

function getOpenAIClient(): OpenAI | null {
  if (!openai && process.env.OPENAI_API_KEY) {
    try {
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 30000, // 30 seconds
        maxRetries: 2,
      })
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error)
      return null
    }
  }
  return openai
}

export interface TripData {
  destinationCountry: string
  destinationCity: string
  destinationState?: string
  destinationDisplayName?: string
  duration: number
  tripType: 'business' | 'leisure' | 'beach' | 'hiking' | 'city' | 'winter' | 'backpacking'
}

export interface PackingItem {
  id: string
  name: string
  category: 'clothing' | 'toiletries' | 'electronics' | 'travel_documents' | 'medication' | 'miscellaneous'
  essential: boolean
  packed: boolean
  custom: boolean
}

export interface PackingListResponse {
  items: Omit<PackingItem, 'id' | 'packed' | 'custom'>[]
}

export class PackingListError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message)
    this.name = 'PackingListError'
  }
}

export async function generatePackingList(tripData: TripData): Promise<PackingItem[]> {
  try {
    const client = getOpenAIClient()
    if (!client) {
      throw new PackingListError('OpenAI service is not available', 'SERVICE_UNAVAILABLE')
    }

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
    console.error('Error generating packing list:', error)
    
    // Re-throw PackingListError as-is
    if (error instanceof PackingListError) {
      throw error
    }
    
    // Wrap other errors
    if (error instanceof Error) {
      throw new PackingListError(error.message, 'UNKNOWN_ERROR')
    }
    
    // Fallback packing list for unknown errors
    console.warn('Falling back to default packing list due to unknown error')
    return getDefaultPackingList()
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