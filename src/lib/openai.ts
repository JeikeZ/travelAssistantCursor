import OpenAI from 'openai'

let openai: OpenAI | null = null

function getOpenAIClient() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

export interface TripData {
  destinationCountry: string
  destinationCity: string
  duration: number
  tripType: string
}

export interface PackingItem {
  id: string
  name: string
  category: string
  essential: boolean
  packed: boolean
  custom: boolean
}

export async function generatePackingList(tripData: TripData): Promise<PackingItem[]> {
  try {
    const client = getOpenAIClient()
    if (!client) {
      throw new Error('OpenAI client not available')
    }

    const prompt = `Generate a comprehensive packing list for a ${tripData.duration}-day ${tripData.tripType} trip to ${tripData.destinationCity}, ${tripData.destinationCountry}.

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
          content: 'You are a helpful travel assistant that generates comprehensive, location-specific packing lists. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    let items: Omit<PackingItem, 'id' | 'packed' | 'custom'>[]
    try {
      items = JSON.parse(content)
    } catch {
      console.error('Failed to parse OpenAI response:', content)
      throw new Error('Invalid response format from AI')
    }

    // Add IDs and default properties
    const packingList: PackingItem[] = items.map((item, index) => ({
      id: `item-${index}`,
      ...item,
      packed: false,
      custom: false,
    }))

    return packingList
  } catch (error) {
    console.error('Error generating packing list:', error)
    
    // Fallback packing list if OpenAI fails
    return getDefaultPackingList()
  }
}

function getDefaultPackingList(): PackingItem[] {
  const essentialItems = [
    { name: 'Passport', category: 'travel_documents', essential: true },
    { name: 'Travel Insurance', category: 'travel_documents', essential: true },
    { name: 'Phone Charger', category: 'electronics', essential: true },
    { name: 'Medications', category: 'medication', essential: true },
    { name: 'Wallet/Credit Cards', category: 'miscellaneous', essential: true },
  ]

  const clothingItems = [
    { name: 'Underwear', category: 'clothing', essential: false },
    { name: 'Socks', category: 'clothing', essential: false },
    { name: 'T-shirts', category: 'clothing', essential: false },
    { name: 'Pants/Jeans', category: 'clothing', essential: false },
    { name: 'Pajamas', category: 'clothing', essential: false },
  ]

  const toiletryItems = [
    { name: 'Toothbrush', category: 'toiletries', essential: false },
    { name: 'Toothpaste', category: 'toiletries', essential: false },
    { name: 'Shampoo', category: 'toiletries', essential: false },
    { name: 'Deodorant', category: 'toiletries', essential: false },
  ]

  const electronicItems = [
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