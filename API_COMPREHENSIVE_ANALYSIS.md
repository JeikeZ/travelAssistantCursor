# Comprehensive API Analysis - Travel Assistant Project

This document provides a detailed analysis of all APIs built for the Travel Assistant project, explaining their architecture, implementation details, and usage patterns throughout the application.

---

## Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [City Search API](#city-search-api)
3. [Weather API](#weather-api)
4. [Packing List Generation API](#packing-list-generation-api)
5. [Trip Management APIs](#trip-management-apis)
6. [Supporting Infrastructure](#supporting-infrastructure)

---

## Authentication APIs

The project implements a comprehensive authentication system with four endpoints supporting both traditional user accounts and guest access.

### 1. `/api/auth/register` - User Registration

**Method:** `POST`

**Purpose:** Creates new user accounts with secure password storage.

**Key Features:**
- **Input Validation:** Validates username (3-20 chars, alphanumeric) and password strength (8+ chars, uppercase, lowercase)
- **Bcrypt Hashing:** All new passwords are hashed using bcrypt with 12 salt rounds
- **Duplicate Prevention:** Checks for existing usernames before account creation
- **Session Management:** Sets HTTP-only cookie with 30-day expiration

**Implementation Highlights:**
```typescript
// Password hashing using bcrypt
const hashedPassword = await hashPassword(password)

// Database insertion with hash type tracking
.insert({
  username,
  password: hashedPassword,
  password_hash_type: 'bcrypt',
})
```

**Security Features:**
- HTTP-only cookies prevent XSS attacks
- Secure flag enabled in production
- SameSite: 'lax' prevents CSRF
- No caching with `force-dynamic` export

**Frontend Usage:** Called from `AuthModal.tsx` during account creation flow.

---

### 2. `/api/auth/login` - User Login

**Method:** `POST`

**Purpose:** Authenticates existing users and establishes sessions.

**Key Features:**
- **Dual Hash Support:** Supports both legacy base64 and modern bcrypt passwords
- **Automatic Migration:** Upgrades base64 passwords to bcrypt on successful login
- **Guest Account Protection:** Prevents guest users from using standard login
- **Secure Error Messages:** Generic error messages prevent username enumeration

**Implementation Highlights:**
```typescript
// Flexible password verification
const hashType = typedUser.password_hash_type || 'base64'
const isPasswordValid = await verifyPassword(password, typedUser.password, hashType)

// Opportunistic password upgrade
if (hashType === 'base64') {
  const newBcryptHash = await hashPasswordBcrypt(password)
  await supabaseServer.from('users').update({
    password: newBcryptHash,
    password_hash_type: 'bcrypt',
  })
}
```

**Backward Compatibility:** Maintains support for legacy base64 passwords while automatically upgrading them to bcrypt, ensuring seamless user experience during security migration.

**Frontend Usage:** Called from `AuthModal.tsx` when users submit login credentials.

---

### 3. `/api/auth/guest` - Guest Account Creation

**Method:** `POST`

**Purpose:** Creates temporary guest accounts for users who don't want to register.

**Key Features:**
- **Atomic Numbering:** Uses database function `get_next_guest_number()` for unique guest IDs
- **Race Condition Handling:** Retries if username collision occurs
- **No Password:** Guest accounts have null passwords for security
- **Guest Flag:** `is_guest: true` enables feature restrictions

**Implementation Highlights:**
```typescript
// Atomic guest number generation
const { data: counterData } = await supabaseServer
  .rpc('get_next_guest_number')

const guestUsername = `guest_user${guestNumber}`

// Retry mechanism for collisions
if (insertError.code === '23505') {
  return POST() // Recursive retry
}
```

**Business Logic:** Guest users can generate packing lists but cannot save trips. This encourages conversion to full accounts while providing immediate value.

**Frontend Usage:** Called from `AuthModal.tsx` when users click "Continue as Guest".

---

### 4. `/api/auth/logout` - Session Termination

**Method:** `POST`

**Purpose:** Ends user sessions and clears authentication cookies.

**Key Features:**
- **Simple & Reliable:** Minimal logic reduces failure points
- **Cookie Deletion:** Removes session cookie completely
- **No-Cache Headers:** Prevents response caching

**Implementation:**
```typescript
response.cookies.delete('session')
response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
```

**Frontend Usage:** Called when users explicitly logout or when session needs to be terminated.

---

## City Search API

### `/api/cities` - Geographic Location Search

**Method:** `GET`

**Purpose:** Provides intelligent city search with country-level support using Open-Meteo Geocoding API.

**Query Parameters:**
- `q` (required): Search query (min 2 chars, max 200)

**Key Features:**

1. **Intelligent Search Logic:**
   - Detects country searches vs. city searches
   - Returns major cities for country queries
   - Filters results to actual populated places

2. **Country Detection:**
```typescript
// Multiple detection methods
- Exact name match: "Japan"
- Country field match in results
- Common variations: "USA" → "United States", "UK" → "United Kingdom"
```

3. **Major Cities Enhancement:**
   - Predefined list of top 10 cities for 25+ countries
   - Fetches each major city individually for accurate results
   - Falls back to generic searches for unlisted countries

4. **Advanced Caching:**
```typescript
const citySearchCache = new LRUCache<CityOption[]>({
  maxSize: 2000,
  maxMemoryMB: 50,
  cacheDuration: 2 * 60 * 60 * 1000, // 2 hours
  cleanupInterval: 30 * 60 * 1000
})
```

5. **Smart Result Ranking:**
   - Capital cities (PPLC) ranked highest
   - Major administrative cities (PPLA, PPLA2) next
   - Population-based sorting within tiers
   - Exact name matches prioritized

**Implementation Highlights:**

```typescript
// Country search handling
if (isCountrySearch && targetCountry) {
  const majorCities = MAJOR_CITIES_BY_COUNTRY[targetCountry]
  
  // Fetch each major city individually
  for (const cityName of majorCities.slice(0, 10)) {
    const cityUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}`
    const cityResponse = await fetch(cityUrl)
    // Add to results...
  }
}
```

**Performance Optimizations:**
- Rate limiting: 100 requests/minute per IP
- Request timeout: 10 seconds
- Deduplication prevents redundant API calls
- CDN-friendly cache headers

**Error Handling:**
- Specific error codes for timeout, rate limits, service unavailability
- Graceful degradation with empty results
- Network error detection and user-friendly messages

**Frontend Usage:** Called from `CitySearchInput.tsx` component with debouncing (300ms) to reduce API calls as users type.

---

## Weather API

### `/api/weather` - Weather Forecast Retrieval

**Method:** `GET`

**Purpose:** Fetches 7-day weather forecasts for specified locations using Open-Meteo Weather API.

**Query Parameters:**
- `city` (required): City name
- `country` (required): Country name

**Architecture:**

```
Client Request
    ↓
Rate Limiter (100/min)
    ↓
Cache Check (30 min TTL)
    ↓
Request Deduplication
    ↓
Geocoding (coordinates)
    ↓
Weather API (forecast)
    ↓
Format & Cache
    ↓
Response
```

**Key Features:**

1. **Two-Step Process:**
```typescript
// Step 1: Get coordinates
const coordinates = await getCoordinates(city, country)
// Returns: { lat, lon }

// Step 2: Fetch weather data
const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=...`
```

2. **Retry Logic with Exponential Backoff:**
```typescript
const weatherResponse = await withRetry(
  () => fetch(weatherUrl, { signal: controller.signal }),
  2,      // 2 retries
  1000    // 1s base delay
)
```

3. **Comprehensive Data:**
   - Daily high/low temperatures
   - Weather codes with emoji icons
   - Precipitation probability
   - Human-readable descriptions

4. **Weather Code Mapping:**
```typescript
WEATHER_CODE_MAP = {
  0: { description: 'Clear sky', icon: '☀️' },
  1: { description: 'Mainly clear', icon: '🌤️' },
  // ... 20+ weather conditions
}
```

5. **Request Deduplication:**
```typescript
// Prevents duplicate requests for same location
return requestDeduplicator.deduplicate(cacheKey, async () => {
  // Fetch logic...
})
```

**Cache Strategy:**
```typescript
const weatherCache = new LRUCache({
  maxSize: 1000,
  maxMemoryMB: 30,
  cacheDuration: 45 * 60 * 1000, // 45 minutes
  cleanupInterval: 15 * 60 * 1000
})
```

**Response Format:**
```typescript
{
  location: "Tokyo, Japan",
  coordinates: { lat: 35.6895, lon: 139.6917 },
  forecast: [
    {
      date: "2025-11-04",
      maxTemp: 22,
      minTemp: 15,
      weatherCode: 0,
      description: "Clear sky",
      icon: "☀️",
      precipitationProbability: 10
    },
    // ... 6 more days
  ]
}
```

**Error Handling:**
- Location not found (404)
- Timeout handling (504)
- Rate limit exceeded (429)
- External API failures (503)

**Frontend Usage:** Called from `TripForm.tsx` to show weather information when user selects destination.

---

## Packing List Generation API

### `/api/generate-packing-list` - AI-Powered Packing Lists

**Method:** `POST`

**Purpose:** Generates customized packing lists using OpenAI GPT-3.5-turbo based on trip parameters.

**Runtime:** `nodejs` (required for OpenAI SDK compatibility)

**Request Body:**
```typescript
{
  destinationCountry: string
  destinationCity: string
  destinationDisplayName?: string
  duration: number (1-365)
  tripType: 'business' | 'leisure' | 'adventure' | 'family' | 'solo'
  startDate?: string
  endDate?: string
}
```

**Key Features:**

1. **Context-Aware Generation:**
```typescript
const prompt = `Generate a comprehensive packing list for a ${duration}-day ${tripType} trip to ${location}.

Consider:
- Local climate and weather conditions
- Cultural customs and dress codes
- Trip duration and type
- Essential travel documents
- Country-specific restrictions
`
```

2. **Structured Output:**
   - 6 predefined categories
   - Essential item flagging
   - Name, category, and essential status for each item

3. **Advanced Caching:**
```typescript
const packingListCache = new LRUCache({
  maxSize: 500,
  maxMemoryMB: 20,
  cacheDuration: 48 * 60 * 60 * 1000, // 48 hours
  cleanupInterval: 60 * 60 * 1000
})

const cacheKey = `${country}-${city}-${duration}-${tripType}`
```

**Cache Benefits:**
- Saves API costs
- Improves response time from ~5s to <50ms
- Reduces OpenAI rate limit pressure

4. **Request Deduplication:**
```typescript
// Prevents duplicate OpenAI calls for identical requests
return packingListDeduplicator.deduplicate(cacheKey, async () => {
  const packingList = await generatePackingList(tripData)
  packingListCache.set(cacheKey, packingList)
  return packingList
})
```

**OpenAI Configuration:**
```typescript
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 25000,  // 25 seconds (less than Vercel's 30s)
  maxRetries: 1,   // Reduce retries to avoid timeout
})

await client.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [...],
  temperature: 0.7,
  max_tokens: 2000,
})
```

**Response Validation:**
```typescript
// Ensures valid JSON array
const parsed = JSON.parse(content)
if (!Array.isArray(parsed)) throw new Error()

// Validates each item structure
items = parsed.map((item, index) => {
  if (!item.name || !item.category) {
    throw new Error(`Invalid item at index ${index}`)
  }
  
  // Category validation
  const validCategories = ['clothing', 'toiletries', 'electronics', 'travel_documents', 'medication', 'miscellaneous']
  
  return {
    name: String(item.name),
    category: validCategories.includes(item.category) ? item.category : 'miscellaneous',
    essential: item.essential === true
  }
})
```

**Error Handling:**
- API key validation
- Timeout protection (35s total)
- Rate limit detection
- Quota exhaustion handling
- JSON parsing errors
- Network failures

**Sample Response:**
```typescript
{
  packingList: [
    {
      id: "item-0",
      name: "Passport",
      category: "travel_documents",
      essential: true,
      packed: false,
      custom: false
    },
    {
      id: "item-1",
      name: "Travel adapter",
      category: "electronics",
      essential: false,
      packed: false,
      custom: false
    },
    // ... more items
  ]
}
```

**Frontend Usage:**
- Called from `TripForm.tsx` after user submits trip details
- Loading state shows "Generating your personalized packing list..."
- Results displayed in `PackingList.tsx` component with category grouping

**Cost Optimization:**
- 48-hour cache reduces API calls significantly
- Cache key based on trip parameters means similar trips share cached results
- Request deduplication prevents concurrent duplicate requests

---

## Trip Management APIs

The trip management system provides a comprehensive CRUD API for trips and their associated packing items, with proper authentication and ownership verification.

### Common Authentication Pattern

All trip APIs use this shared authentication helper:

```typescript
async function getUserFromSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  
  if (!sessionCookie) return null
  
  try {
    const session = JSON.parse(sessionCookie.value)
    return session.user
  } catch {
    return null
  }
}

async function verifyTripOwnership(tripId: string, userId: string) {
  const { data: trip } = await supabaseServer
    .from('trips')
    .select('user_id')
    .eq('id', tripId)
    .single()
    
  return trip?.user_id === userId
}
```

This ensures:
- Requests are authenticated
- Users can only access their own trips
- Guest users have appropriate restrictions

---

### 1. `/api/trips` - Trip Collection Management

**Methods:** `GET`, `POST`

#### POST - Create New Trip

**Purpose:** Creates a new trip record for authenticated users.

**Request Body:**
```typescript
{
  destinationCountry: string
  destinationCity: string
  destinationState?: string
  destinationDisplayName?: string
  duration: number (1-365 days)
  tripType: 'business' | 'leisure' | 'adventure' | 'family' | 'solo'
  startDate?: string
  endDate?: string
  notes?: string
}
```

**Key Features:**
- **Guest Prevention:** Returns 403 for guest users
- **Validation:** Checks required fields and duration range
- **Auto-initialization:** Sets status to 'active', completion to 0%
- **Timestamps:** Auto-populates created_at, updated_at

**Database Schema:**
```sql
trips {
  id: uuid (PK)
  user_id: uuid (FK → users)
  destination_country: text
  destination_city: text
  destination_state: text?
  destination_display_name: text?
  duration: int
  trip_type: text
  start_date: date?
  end_date: date?
  notes: text?
  status: 'active' | 'completed' | 'archived'
  completion_percentage: int
  is_favorite: boolean
  created_at: timestamp
  updated_at: timestamp
  completed_at: timestamp?
}
```

**Response:**
```typescript
{
  success: true,
  trip: { /* Trip object */ }
}
```

#### GET - Fetch User's Trips

**Purpose:** Retrieves all trips for authenticated user with filtering, sorting, and pagination.

**Query Parameters:**
- `status`: 'all' | 'active' | 'completed' | 'archived' (default: 'all')
- `limit`: number (default: 50)
- `offset`: number (default: 0)
- `sortBy`: column name (default: 'created_at')
- `sortOrder`: 'asc' | 'desc' (default: 'desc')

**Key Features:**
- **Dynamic Filtering:** Status-based filtering
- **Flexible Sorting:** Sort by any column
- **Pagination Support:** Offset-based pagination
- **Count Tracking:** Returns total count and hasMore flag

**Implementation:**
```typescript
let query = supabaseServer
  .from('trips')
  .select('*', { count: 'exact' })
  .eq('user_id', user.id)

// Apply filters
if (status !== 'all') {
  query = query.eq('status', status)
}

// Apply sorting
query = query.order(sortBy, { ascending: sortOrder === 'asc' })

// Apply pagination
query = query.range(offset, offset + limit - 1)
```

**Response:**
```typescript
{
  trips: Trip[],
  total: number,
  hasMore: boolean
}
```

**Frontend Usage:** Called from `useTrips.ts` hook to populate trip list in trip history page.

---

### 2. `/api/trips/[id]` - Individual Trip Management

**Methods:** `GET`, `PUT`, `DELETE`

#### GET - Fetch Trip Details

**Purpose:** Retrieves complete trip information including all packing items and statistics.

**Key Features:**
- **Ownership Verification:** Ensures user owns the trip
- **Associated Data:** Fetches packing items in one request
- **Statistics Calculation:** Computes completion percentage

**Response:**
```typescript
{
  trip: Trip,
  packingItems: PackingItemDb[],
  statistics: {
    totalItems: number,
    packedItems: number,
    completionPercentage: number
  }
}
```

**Implementation:**
```typescript
// Fetch trip
const { data: trip } = await supabaseServer
  .from('trips')
  .select('*')
  .eq('id', id)
  .single()

// Fetch items with sorting
const { data: packingItems } = await supabaseServer
  .from('packing_items')
  .select('*')
  .eq('trip_id', id)
  .order('category', { ascending: true })

// Calculate stats
const totalItems = packingItems.length
const packedItems = packingItems.filter(item => item.packed).length
const completionPercentage = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0
```

#### PUT - Update Trip

**Purpose:** Updates trip properties and metadata.

**Request Body (all optional):**
```typescript
{
  status?: 'active' | 'completed' | 'archived'
  notes?: string
  isFavorite?: boolean
  completionPercentage?: number
  startDate?: string
  endDate?: string
}
```

**Key Features:**
- **Partial Updates:** Only specified fields are updated
- **Auto-timestamp:** Sets updated_at automatically
- **Completion Tracking:** Sets completed_at when status changes to 'completed'

**Implementation:**
```typescript
const updateData = {
  updated_at: new Date().toISOString()
}

if (body.status !== undefined) {
  updateData.status = body.status
  if (body.status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  }
}

if (body.notes !== undefined) updateData.notes = body.notes
if (body.isFavorite !== undefined) updateData.is_favorite = body.isFavorite
// ... other fields
```

#### DELETE - Delete Trip

**Purpose:** Removes trip and all associated packing items.

**Key Features:**
- **Cascade Delete:** Database automatically deletes associated packing items
- **Ownership Verification:** Ensures user owns the trip
- **Clean Response:** Simple success confirmation

**Frontend Usage:** Called from `useTripDetail.ts` hook for real-time trip management.

---

### 3. `/api/trips/[id]/items` - Packing Item Collection

**Methods:** `GET`, `POST`

#### POST - Add Packing Item

**Purpose:** Adds a new item to trip's packing list.

**Request Body:**
```typescript
{
  name: string
  category: 'clothing' | 'toiletries' | 'electronics' | 'travel_documents' | 'medication' | 'miscellaneous'
  essential?: boolean (default: false)
  custom?: boolean (default: true)
  quantity?: number (default: 1)
  notes?: string
}
```

**Key Features:**
- **User-Added Items:** `custom: true` distinguishes user-added vs AI-generated items
- **Auto-unpacked:** New items start as `packed: false`
- **Trip Update:** Updates trip's updated_at timestamp

**Database Schema:**
```sql
packing_items {
  id: uuid (PK)
  trip_id: uuid (FK → trips)
  name: text
  category: text
  essential: boolean
  packed: boolean
  custom: boolean
  quantity: int
  notes: text?
  created_at: timestamp
  updated_at: timestamp
}
```

#### GET - Fetch All Items

**Purpose:** Retrieves all packing items for a trip with sorting.

**Key Features:**
- **Sorted Results:** Ordered by category, then by name
- **Ownership Check:** Verifies user owns the trip

**Response:**
```typescript
{
  items: PackingItemDb[]
}
```

**Frontend Usage:** Called from `useTripDetail.ts` to populate packing list display.

---

### 4. `/api/trips/[id]/items/[itemId]` - Individual Item Management

**Methods:** `PUT`, `DELETE`

#### PUT - Update Packing Item

**Purpose:** Updates item properties including packed status.

**Request Body (all optional):**
```typescript
{
  name?: string
  packed?: boolean
  quantity?: number
  notes?: string
  category?: string
  essential?: boolean
}
```

**Key Features:**
- **Completion Tracking:** Recalculates trip completion percentage when packed status changes
- **Trip Update:** Updates trip's updated_at timestamp
- **Efficient Calculation:** Only recalculates stats if packed status changed

**Implementation:**
```typescript
// Update item
const { data: item } = await supabaseServer
  .from('packing_items')
  .update(updateData)
  .eq('id', itemId)
  .eq('trip_id', tripId)
  .single()

// Recalculate completion if packed status changed
if (body.packed !== undefined) {
  const { data: allItems } = await supabaseServer
    .from('packing_items')
    .select('packed')
    .eq('trip_id', tripId)
    
  const packedCount = allItems.filter(i => i.packed).length
  const completionPercentage = Math.round((packedCount / allItems.length) * 100)
  
  await supabaseServer
    .from('trips')
    .update({ completion_percentage: completionPercentage })
    .eq('id', tripId)
}
```

#### DELETE - Remove Packing Item

**Purpose:** Removes item from packing list and updates trip stats.

**Key Features:**
- **Auto-recalculation:** Updates completion percentage after deletion
- **Zero Handling:** Sets completion to 0% if no items remain
- **Trip Update:** Updates trip's updated_at timestamp

**Implementation:**
```typescript
// Delete item
await supabaseServer
  .from('packing_items')
  .delete()
  .eq('id', itemId)
  .eq('trip_id', tripId)

// Recalculate stats
const { data: allItems } = await supabaseServer
  .from('packing_items')
  .select('packed')
  .eq('trip_id', tripId)

if (allItems && allItems.length > 0) {
  const packedCount = allItems.filter(i => i.packed).length
  const completionPercentage = Math.round((packedCount / allItems.length) * 100)
  
  await supabaseServer
    .from('trips')
    .update({ completion_percentage: completionPercentage })
    .eq('id', tripId)
} else {
  // No items left
  await supabaseServer
    .from('trips')
    .update({ completion_percentage: 0 })
    .eq('id', tripId)
}
```

**Frontend Usage:** Called from `useTripDetail.ts` for real-time item management.

---

### 5. `/api/trips/[id]/duplicate` - Trip Duplication

**Method:** `POST`

**Purpose:** Creates a copy of an existing trip with all packing items.

**Request Body:**
```typescript
{
  newStartDate?: string
  newEndDate?: string
}
```

**Key Features:**
- **Complete Copy:** Duplicates trip details and all packing items
- **Reset State:** New trip starts as 'active' with 0% completion
- **Unpacked Items:** All items reset to `packed: false`
- **New Dates:** Optionally set new start/end dates

**Implementation Flow:**
```typescript
1. Fetch original trip
2. Create new trip with same details
3. Fetch original packing items
4. Copy items to new trip (reset packed status)
5. Return new trip
```

**Use Case:** Enables users to quickly create similar trips (e.g., recurring business travel to same city) without manual recreation.

**Response:**
```typescript
{
  success: true,
  newTrip: Trip
}
```

**Frontend Usage:** Called from trip detail page or trip list to duplicate existing trips.

---

### 6. `/api/trips/stats` - Trip Statistics

**Method:** `GET`

**Purpose:** Provides aggregated statistics about user's travel history.

**Key Features:**
- **Comprehensive Metrics:** Total trips, completion stats, unique destinations
- **Top Destinations:** Most visited cities
- **Favorite Trips:** Recently favorited trips

**Response:**
```typescript
{
  totalTrips: number
  completedTrips: number
  activeTrips: number
  archivedTrips: number
  totalCountriesVisited: number
  totalCitiesVisited: number
  mostVisitedDestinations: [
    { destination: string, count: number },
    // ... top 5
  ]
  favoriteTrips: Trip[] // top 5
}
```

**Implementation:**
```typescript
// Fetch all trips
const { data: trips } = await supabaseServer
  .from('trips')
  .select('*')
  .eq('user_id', user.id)

// Calculate statistics
const totalTrips = trips.length
const completedTrips = trips.filter(t => t.status === 'completed').length
const activeTrips = trips.filter(t => t.status === 'active').length

// Unique counts
const uniqueCountries = new Set(trips.map(t => t.destination_country))
const uniqueCities = new Set(trips.map(t => `${t.destination_city}, ${t.destination_country}`))

// Most visited
const destinationCounts: Record<string, number> = {}
trips.forEach(trip => {
  const destination = `${trip.destination_city}, ${trip.destination_country}`
  destinationCounts[destination] = (destinationCounts[destination] || 0) + 1
})

const mostVisited = Object.entries(destinationCounts)
  .map(([destination, count]) => ({ destination, count }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 5)
```

**Frontend Usage:** Called from trip history dashboard to display user travel statistics.

---

## Supporting Infrastructure

### 1. Cache System (`/src/lib/cache.ts`)

**Purpose:** Provides high-performance LRU (Least Recently Used) caching with memory management.

**Features:**

```typescript
class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private currentMemoryUsage = 0
  
  // Core features:
  - Size-based eviction (maxSize)
  - Memory-based eviction (maxMemoryMB)
  - Time-based expiration (cacheDuration)
  - Auto-cleanup (cleanupInterval)
  - Access count tracking for LRU
}
```

**Memory Estimation:**
```typescript
// Estimates memory usage per entry
const serialized = JSON.stringify(data)
const dataSize = (serialized?.length || 0) * 2 // UTF-16 = 2 bytes per char
```

**Eviction Strategy:**
```typescript
// Evict least recently used when limits reached
private evictLeastUsed(): void {
  let leastUsedKey = ''
  let leastAccessCount = Infinity
  
  for (const [key, entry] of this.cache.entries()) {
    if (entry.accessCount < leastAccessCount) {
      leastUsedKey = key
      leastAccessCount = entry.accessCount
    }
  }
  
  this.cache.delete(leastUsedKey)
}
```

**Cache Configurations:**
```typescript
CACHE_CONFIGS = {
  weather: {
    maxSize: 1000,
    maxMemoryMB: 30,
    cacheDuration: 45 * 60 * 1000,     // 45 minutes
    cleanupInterval: 15 * 60 * 1000    // 15 minutes
  },
  cities: {
    maxSize: 2000,
    maxMemoryMB: 50,
    cacheDuration: 2 * 60 * 60 * 1000, // 2 hours
    cleanupInterval: 30 * 60 * 1000
  },
  packingList: {
    maxSize: 500,
    maxMemoryMB: 20,
    cacheDuration: 48 * 60 * 60 * 1000, // 48 hours
    cleanupInterval: 60 * 60 * 1000
  }
}
```

**Request Deduplication:**
```typescript
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<unknown>>()
  
  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // If request already pending, return same promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>
    }
    
    // Create new promise and track it
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key)
    })
    
    this.pendingRequests.set(key, promise)
    return promise
  }
}
```

**Benefits:**
- Reduces database load
- Improves response times
- Manages memory efficiently
- Prevents duplicate concurrent requests

---

### 2. API Utilities (`/src/lib/api-utils.ts`)

**Purpose:** Provides standardized helpers for API route implementation.

**Key Functions:**

#### Error Response Helper
```typescript
function createErrorResponse(
  error: string,
  statusCode: number = 500,
  code?: string
): NextResponse<ApiError> {
  return NextResponse.json(
    { error, code },
    { status: statusCode }
  )
}
```

#### Success Response Helper (with CDN caching)
```typescript
function createSuccessResponse<T>(
  data: T,
  cacheMaxAge: number = 3600
): NextResponse<T> {
  const response = NextResponse.json(data)
  
  // Optimized caching headers for public APIs
  response.headers.set('Cache-Control', `public, max-age=${cacheMaxAge}, stale-while-revalidate=${cacheMaxAge * 2}`)
  response.headers.set('CDN-Cache-Control', `public, max-age=${cacheMaxAge}`)
  response.headers.set('Vercel-CDN-Cache-Control', `public, max-age=${cacheMaxAge}`)
  
  return response
}
```

#### Rate Limiter
```typescript
class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>()
  
  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }
  
  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const record = this.requests.get(identifier)
    
    if (!record || now > record.resetTime) {
      this.requests.set(identifier, { count: 1, resetTime: now + this.windowMs })
      return true
    }
    
    if (record.count >= this.maxRequests) {
      return false
    }
    
    record.count++
    return true
  }
}

export const rateLimiter = new RateLimiter(100, 60000) // 100 req/min
```

#### Timeout Helper
```typescript
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Request timeout'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    )
  ])
}
```

#### Retry Helper (with exponential backoff)
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries) throw error
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}
```

**Usage Example:**
```typescript
export async function GET(request: NextRequest) {
  // Rate limiting
  const clientIP = getClientIP(request)
  if (!rateLimiter.isAllowed(clientIP)) {
    return createErrorResponse('Too many requests', 429, 'RATE_LIMIT_EXCEEDED')
  }
  
  try {
    const data = await withTimeout(
      withRetry(() => fetchData(), 2, 500),
      10000,
      'Request timeout'
    )
    
    return createSuccessResponse(data, 3600)
  } catch (error) {
    return createErrorResponse('Failed to fetch data', 500)
  }
}
```

---

### 3. Authentication Utilities (`/src/lib/auth-utils-server.ts`)

**Purpose:** Server-side password hashing and verification with bcrypt.

**Key Functions:**

```typescript
// Bcrypt hashing for new passwords
async function hashPasswordBcrypt(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

// Default hashing (uses bcrypt)
async function hashPassword(password: string): Promise<string> {
  return hashPasswordBcrypt(password)
}

// Flexible verification (supports legacy base64)
async function verifyPassword(
  password: string,
  hash: string,
  hashType: 'base64' | 'bcrypt' = 'bcrypt'
): Promise<boolean> {
  if (hashType === 'bcrypt') {
    return bcrypt.compare(password, hash)
  } else {
    // Legacy base64 verification
    const passwordHash = Buffer.from(password).toString('base64')
    return passwordHash === hash
  }
}
```

**Security Features:**
- 12 salt rounds for bcrypt (strong security)
- Async operations (non-blocking)
- Backward compatibility with legacy hashes
- Server-only execution (bcrypt not in client bundle)

---

### 4. Frontend Hooks

#### `usePackingList.ts` - Packing List Management

**Purpose:** Manages packing list state in local storage with optimizations.

**Key Features:**
```typescript
- Toggle item packed status
- Add custom items
- Delete items
- Edit item names
- Calculate progress statistics
- Group items by category
- Sort categories (essential first)
```

**Performance Optimizations:**
- WeakMap cache for category grouping
- Array equality comparison prevents unnecessary re-renders
- Debounced localStorage saves
- Single-pass category grouping and sorting

#### `useTrips.ts` - Trip Collection Management

**Purpose:** Provides CRUD operations for trip collections.

**Functions:**
```typescript
{
  fetchTrips: (filters?) => Promise<void>
  createTrip: (tripData) => Promise<Trip | null>
  updateTrip: (tripId, updates) => Promise<boolean>
  deleteTrip: (tripId) => Promise<boolean>
  duplicateTrip: (tripId, dates?) => Promise<Trip | null>
  refreshTrips: () => Promise<void>
}
```

**State Management:**
```typescript
{
  trips: Trip[]
  isLoading: boolean
  error: string | null
  total: number
  hasMore: boolean
}
```

#### `useTripDetail.ts` - Individual Trip Management

**Purpose:** Manages single trip with real-time item updates.

**Functions:**
```typescript
{
  fetchTrip: () => Promise<void>
  updateTrip: (updates) => Promise<boolean>
  addItem: (item) => Promise<PackingItemDb | null>
  updateItem: (itemId, updates) => Promise<boolean>
  deleteItem: (itemId) => Promise<boolean>
  toggleItemPacked: (itemId) => Promise<boolean>
  refreshTrip: () => Promise<void>
}
```

**State Management:**
```typescript
{
  trip: Trip | null
  packingItems: PackingItemDb[]
  statistics: {
    totalItems: number
    packedItems: number
    completionPercentage: number
  }
  isLoading: boolean
  error: string | null
}
```

**Local State Optimization:**
- Optimistic updates for immediate UI feedback
- Automatic statistics recalculation
- Error handling with rollback capability

---

## API Architecture Patterns

### 1. **Layered Architecture**

```
┌─────────────────────────────────────┐
│   Frontend Components (React)       │
├─────────────────────────────────────┤
│   Custom Hooks (useTrips, etc.)     │
├─────────────────────────────────────┤
│   API Routes (/api/*)               │
├─────────────────────────────────────┤
│   Business Logic (lib/)             │
├─────────────────────────────────────┤
│   External APIs (OpenAI, Open-Meteo)│
│   Database (Supabase)               │
└─────────────────────────────────────┘
```

### 2. **Security Principles**

- **Authentication:** Cookie-based sessions with HTTP-only flag
- **Authorization:** Row-level ownership verification
- **Input Validation:** Server-side validation for all inputs
- **Rate Limiting:** Per-IP limits to prevent abuse
- **CSRF Protection:** SameSite cookie attribute
- **XSS Prevention:** HTTP-only cookies, sanitized outputs

### 3. **Performance Optimizations**

- **Multi-level Caching:**
  - Memory (LRU cache): Fastest, for frequently accessed data
  - CDN (Cache-Control headers): For public APIs
  - Request deduplication: Prevents duplicate concurrent requests

- **Database Optimization:**
  - Selective field queries (`.select('field1, field2')`)
  - Indexed queries (user_id, trip_id foreign keys)
  - Batch operations where possible

- **API Response Optimization:**
  - Gzip compression (handled by Vercel)
  - Efficient JSON serialization
  - Minimal data transfer

### 4. **Error Handling Strategy**

**Consistent Error Format:**
```typescript
{
  success: false,
  error: "User-friendly message",
  code?: "ERROR_CODE"
}
```

**Error Codes:**
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `TIMEOUT`: Request took too long
- `INVALID_INPUT`: Validation failed
- `AUTHENTICATION_REQUIRED`: Not logged in
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource doesn't exist

**Logging:**
```typescript
console.error('Error in API:', {
  errorType: error.constructor.name,
  errorMessage: error.message,
  errorStack: error.stack,
  timestamp: new Date().toISOString(),
  context: { /* relevant data */ }
})
```

### 5. **Testing Strategy**

**Unit Tests:**
- `/workspace/__tests__/api/` - API route testing
- `/workspace/__tests__/hooks/` - Custom hook testing
- `/workspace/__tests__/lib/` - Utility function testing

**E2E Tests:**
- `/workspace/e2e/travel-flow.spec.ts` - End-to-end user flows

---

## Key Takeaways

### What Makes This API Architecture Strong

1. **Separation of Concerns:**
   - Clear separation between routes, business logic, and data access
   - Reusable utilities and helpers
   - Consistent patterns across all endpoints

2. **Scalability:**
   - Efficient caching reduces database load
   - Rate limiting prevents abuse
   - Memory management prevents server crashes

3. **User Experience:**
   - Guest accounts lower entry barrier
   - Fast responses via caching
   - Real-time feedback with optimistic updates

4. **Developer Experience:**
   - Type safety with TypeScript
   - Consistent error handling
   - Comprehensive logging
   - Clear code structure

5. **Cost Optimization:**
   - Aggressive caching reduces OpenAI API costs
   - Request deduplication prevents duplicate calls
   - Efficient database queries minimize RPC costs

### API Usage Flow Example

**Creating and Managing a Trip:**

```
1. User opens app
   ↓
2. AuthModal → POST /api/auth/guest (if no account)
   ↓
3. TripForm → GET /api/cities?q=Tokyo (city search)
   ↓
4. TripForm → GET /api/weather?city=Tokyo&country=Japan
   ↓
5. TripForm submit → POST /api/generate-packing-list
   ↓
6. Save trip → POST /api/trips (requires full account)
   ↓
7. Manage items → PUT /api/trips/{id}/items/{itemId}
   ↓
8. View history → GET /api/trips?status=all
   ↓
9. View stats → GET /api/trips/stats
```

---

## Future Enhancement Opportunities

### Potential API Improvements

1. **Batch Operations:**
   - `POST /api/trips/[id]/items/batch` - Add multiple items at once
   - `PUT /api/trips/[id]/items/batch` - Update multiple items

2. **Search & Filter:**
   - `GET /api/trips/search?q=tokyo` - Full-text search
   - Advanced filtering with multiple criteria

3. **Sharing & Collaboration:**
   - `POST /api/trips/[id]/share` - Generate shareable links
   - `POST /api/trips/[id]/collaborate` - Invite other users

4. **Analytics:**
   - `GET /api/analytics/trends` - Travel pattern analysis
   - `GET /api/analytics/recommendations` - Personalized suggestions

5. **Real-time Updates:**
   - WebSocket support for collaborative editing
   - Server-Sent Events for notifications

6. **Export/Import:**
   - `GET /api/trips/[id]/export` - Export as PDF/JSON
   - `POST /api/trips/import` - Import from other formats

---

## Conclusion

The Travel Assistant API architecture demonstrates modern best practices in web API design, including:

- **Robust authentication** with multiple access methods
- **Intelligent caching** at multiple levels
- **External API integration** with proper error handling
- **User-centric design** balancing functionality and ease of use
- **Performance optimization** throughout the stack
- **Security-first approach** at every layer

The system successfully balances immediate user value (guest accounts, fast responses) with long-term engagement (full accounts, trip history) while maintaining code quality, performance, and security standards.
