# API Quick Reference Guide

A concise reference for all Travel Assistant APIs.

---

## 📚 Table of Contents

- [Authentication APIs](#authentication-apis)
- [Public APIs](#public-apis)
- [Trip Management APIs](#trip-management-apis)
- [Common Patterns](#common-patterns)
- [Error Codes](#error-codes)

---

## 🔐 Authentication APIs

### POST `/api/auth/register`
Create a new user account.

**Body:**
```json
{
  "username": "string (3-20 chars, alphanumeric)",
  "password": "string (8+ chars, uppercase, lowercase)"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "string",
    "created_at": "timestamp"
  }
}
```

**Features:**
- ✅ Bcrypt password hashing (12 rounds)
- ✅ Username uniqueness check
- ✅ HTTP-only session cookie (30 days)
- ❌ No guest users

---

### POST `/api/auth/login`
Login with existing account.

**Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:** Same as register

**Features:**
- ✅ Supports legacy base64 passwords
- ✅ Auto-upgrades to bcrypt
- ✅ Prevents guest account login
- ✅ Generic error messages (prevents enumeration)

---

### POST `/api/auth/guest`
Create a guest account (no credentials needed).

**Body:** None

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "guest_user123",
    "is_guest": true,
    "created_at": "timestamp"
  }
}
```

**Features:**
- ✅ Atomic numbering via DB function
- ✅ Retry on collision
- ✅ No password required
- ⚠️ Cannot save trips (local only)

---

### POST `/api/auth/logout`
End user session.

**Body:** None

**Response:**
```json
{
  "success": true
}
```

**Features:**
- ✅ Deletes session cookie
- ✅ Always succeeds

---

## 🌍 Public APIs

These APIs work without authentication (with rate limiting).

### GET `/api/cities?q={query}`
Search for cities and countries.

**Parameters:**
- `q`: Search query (2-200 chars)

**Response:**
```json
{
  "cities": [
    {
      "id": "string",
      "name": "Tokyo",
      "country": "Japan",
      "admin1": "Tokyo",
      "latitude": 35.6895,
      "longitude": 139.6917,
      "displayName": "Tokyo, Tokyo, Japan"
    }
  ]
}
```

**Features:**
- ✅ Smart country detection
- ✅ Major cities enhancement
- ✅ LRU cache (2 hours, 2000 entries)
- ✅ Rate limit: 100 req/min
- ✅ Timeout: 10 seconds

**Cache Key:** `query.toLowerCase()`

---

### GET `/api/weather?city={city}&country={country}`
Get 7-day weather forecast.

**Parameters:**
- `city`: City name
- `country`: Country name

**Response:**
```json
{
  "location": "Tokyo, Japan",
  "coordinates": { "lat": 35.6895, "lon": 139.6917 },
  "forecast": [
    {
      "date": "2025-11-04",
      "maxTemp": 22,
      "minTemp": 15,
      "weatherCode": 0,
      "description": "Clear sky",
      "icon": "☀️",
      "precipitationProbability": 10
    }
  ]
}
```

**Features:**
- ✅ Open-Meteo API integration
- ✅ Request deduplication
- ✅ LRU cache (45 min, 1000 entries)
- ✅ Retry logic (2 retries, exponential backoff)
- ✅ Rate limit: 100 req/min
- ✅ Timeout: 15 seconds

**Cache Key:** `${city}-${country}`.toLowerCase()

---

### POST `/api/generate-packing-list`
Generate AI-powered packing list.

**Body:**
```json
{
  "destinationCountry": "Japan",
  "destinationCity": "Tokyo",
  "destinationDisplayName": "Tokyo, Japan",
  "duration": 7,
  "tripType": "leisure",
  "startDate": "2025-11-10",
  "endDate": "2025-11-17"
}
```

**Response:**
```json
{
  "packingList": [
    {
      "id": "item-0",
      "name": "Passport",
      "category": "travel_documents",
      "essential": true,
      "packed": false,
      "custom": false
    }
  ]
}
```

**Categories:**
- `clothing`
- `toiletries`
- `electronics`
- `travel_documents`
- `medication`
- `miscellaneous`

**Features:**
- ✅ OpenAI GPT-3.5-turbo
- ✅ Context-aware generation
- ✅ LRU cache (48 hours, 500 entries)
- ✅ Request deduplication
- ✅ Rate limit: 100 req/min
- ✅ Timeout: 35 seconds
- 💰 Cost optimized via caching

**Cache Key:** `${country}-${city}-${duration}-${tripType}`.toLowerCase()

---

## 🗺️ Trip Management APIs

**Auth Required:** ✅ All endpoints require authentication

**Guest Restrictions:** ⚠️ Guests cannot use these APIs

### POST `/api/trips`
Create a new trip.

**Body:**
```json
{
  "destinationCountry": "Japan",
  "destinationCity": "Tokyo",
  "destinationState": "Tokyo",
  "destinationDisplayName": "Tokyo, Tokyo, Japan",
  "duration": 7,
  "tripType": "leisure",
  "startDate": "2025-11-10",
  "endDate": "2025-11-17",
  "notes": "First trip to Japan!"
}
```

**Response:**
```json
{
  "success": true,
  "trip": {
    "id": "uuid",
    "user_id": "uuid",
    "destination_country": "Japan",
    "destination_city": "Tokyo",
    "duration": 7,
    "trip_type": "leisure",
    "status": "active",
    "completion_percentage": 0,
    "is_favorite": false,
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

**Validation:**
- Duration: 1-365 days
- All required fields must be present

---

### GET `/api/trips?status={status}&limit={limit}&offset={offset}&sortBy={field}&sortOrder={order}`
Get user's trips with filtering and pagination.

**Parameters (all optional):**
- `status`: 'all' | 'active' | 'completed' | 'archived' (default: 'all')
- `limit`: number (default: 50)
- `offset`: number (default: 0)
- `sortBy`: column name (default: 'created_at')
- `sortOrder`: 'asc' | 'desc' (default: 'desc')

**Response:**
```json
{
  "trips": [/* Trip[] */],
  "total": 42,
  "hasMore": true
}
```

---

### GET `/api/trips/{id}`
Get trip details with packing items and statistics.

**Response:**
```json
{
  "trip": {/* Trip */},
  "packingItems": [/* PackingItemDb[] */],
  "statistics": {
    "totalItems": 25,
    "packedItems": 10,
    "completionPercentage": 40
  }
}
```

---

### PUT `/api/trips/{id}`
Update trip properties.

**Body (all optional):**
```json
{
  "status": "completed",
  "notes": "Great trip!",
  "isFavorite": true,
  "completionPercentage": 100,
  "startDate": "2025-11-10",
  "endDate": "2025-11-17"
}
```

**Features:**
- ✅ Auto-sets `completed_at` when status → 'completed'
- ✅ Updates `updated_at` automatically

---

### DELETE `/api/trips/{id}`
Delete trip and all packing items.

**Response:**
```json
{
  "success": true
}
```

**Features:**
- ✅ Cascade deletes packing items

---

### POST `/api/trips/{id}/items`
Add packing item to trip.

**Body:**
```json
{
  "name": "Sunglasses",
  "category": "miscellaneous",
  "essential": false,
  "quantity": 1,
  "notes": "Polarized"
}
```

**Response:**
```json
{
  "success": true,
  "item": {
    "id": "uuid",
    "trip_id": "uuid",
    "name": "Sunglasses",
    "category": "miscellaneous",
    "essential": false,
    "packed": false,
    "custom": true,
    "quantity": 1,
    "notes": "Polarized",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

---

### GET `/api/trips/{id}/items`
Get all packing items for trip.

**Response:**
```json
{
  "items": [/* PackingItemDb[] sorted by category, name */]
}
```

---

### PUT `/api/trips/{id}/items/{itemId}`
Update packing item.

**Body (all optional):**
```json
{
  "name": "Sunglasses",
  "packed": true,
  "quantity": 2,
  "notes": "Bring backup pair",
  "category": "miscellaneous",
  "essential": false
}
```

**Features:**
- ✅ Auto-recalculates completion % when `packed` changes
- ✅ Updates trip's `updated_at`

---

### DELETE `/api/trips/{id}/items/{itemId}`
Delete packing item.

**Response:**
```json
{
  "success": true
}
```

**Features:**
- ✅ Recalculates completion %
- ✅ Sets completion to 0% if no items remain

---

### POST `/api/trips/{id}/duplicate`
Duplicate trip with all items.

**Body:**
```json
{
  "newStartDate": "2025-12-01",
  "newEndDate": "2025-12-08"
}
```

**Response:**
```json
{
  "success": true,
  "newTrip": {/* Trip with new ID */}
}
```

**Features:**
- ✅ Copies all trip details
- ✅ Copies all packing items
- ✅ Resets all items to `packed: false`
- ✅ New trip starts as 'active' with 0% completion

---

### GET `/api/trips/stats`
Get user's trip statistics.

**Response:**
```json
{
  "totalTrips": 15,
  "completedTrips": 10,
  "activeTrips": 3,
  "archivedTrips": 2,
  "totalCountriesVisited": 8,
  "totalCitiesVisited": 12,
  "mostVisitedDestinations": [
    { "destination": "Tokyo, Japan", "count": 3 },
    { "destination": "Paris, France", "count": 2 }
  ],
  "favoriteTrips": [/* Trip[] - top 5 recent favorites */]
}
```

---

## 🔧 Common Patterns

### Authentication Check
```typescript
const user = await getUserFromSession()
if (!user) {
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
}

if (user.is_guest) {
  return NextResponse.json({ error: 'Guest users cannot...' }, { status: 403 })
}
```

### Ownership Verification
```typescript
const ownsTrip = await verifyTripOwnership(tripId, user.id)
if (!ownsTrip) {
  return NextResponse.json({ error: 'Not found or access denied' }, { status: 404 })
}
```

### Rate Limiting
```typescript
const clientIP = getClientIP(request)
if (!rateLimiter.isAllowed(clientIP)) {
  return createErrorResponse('Too many requests', 429, 'RATE_LIMIT_EXCEEDED')
}
```

### Cache Usage
```typescript
const cacheKey = generateCacheKey(params)
const cached = cache.get(cacheKey)
if (cached) return cached

const result = await fetchData(params)
cache.set(cacheKey, result)
return result
```

### Request Deduplication
```typescript
return requestDeduplicator.deduplicate(cacheKey, async () => {
  const data = await expensiveOperation()
  cache.set(cacheKey, data)
  return data
})
```

### Timeout Protection
```typescript
const data = await withTimeout(
  fetchExternalAPI(),
  10000,
  'Request timeout'
)
```

### Retry with Backoff
```typescript
const data = await withRetry(
  () => fetch(url),
  2,      // max retries
  1000    // base delay ms
)
```

---

## ❌ Error Codes

### Authentication Errors
- `401` - `AUTHENTICATION_REQUIRED`: No session cookie
- `403` - `FORBIDDEN`: Guest user attempting restricted action
- `409` - `USERNAME_EXISTS`: Username already taken

### Validation Errors
- `400` - `INVALID_INPUT`: Missing or invalid fields
- `400` - `INVALID_DURATION`: Duration not in 1-365 range
- `400` - `INVALID_QUERY_LENGTH`: Search query too short
- `400` - `QUERY_TOO_LONG`: Search query exceeds limit

### Rate Limiting
- `429` - `RATE_LIMIT_EXCEEDED`: Too many requests (100/min)

### External API Errors
- `502` - `BAD_GATEWAY`: Invalid response from external API
- `503` - `SERVICE_UNAVAILABLE`: External service down
- `504` - `TIMEOUT`: Request took too long

### OpenAI Specific
- `503` - `API_KEY_MISSING`: OpenAI key not configured
- `503` - `API_KEY_INVALID`: Invalid OpenAI key
- `429` - `RATE_LIMIT`: OpenAI rate limit
- `503` - `INSUFFICIENT_QUOTA`: OpenAI credits exhausted

### Resource Errors
- `404` - `NOT_FOUND`: Resource doesn't exist
- `404` - `LOCATION_NOT_FOUND`: City/country not found

### Generic Errors
- `500` - `INTERNAL_ERROR`: Unexpected server error

---

## 📊 Cache Configuration

| Cache | Duration | Max Size | Max Memory | Use Case |
|-------|----------|----------|------------|----------|
| Weather | 45 min | 1000 | 30 MB | Weather forecasts |
| Cities | 2 hours | 2000 | 50 MB | City search results |
| Packing List | 48 hours | 500 | 20 MB | AI-generated lists |

---

## 🔒 Security Features

### Cookie Security
```typescript
{
  httpOnly: true,              // Prevents XSS
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',             // Prevents CSRF
  maxAge: 60 * 60 * 24 * 30,  // 30 days
  path: '/',
}
```

### Password Security
- Bcrypt with 12 salt rounds
- Minimum 8 characters
- Requires uppercase and lowercase
- No password for guest accounts

### Rate Limiting
- 100 requests per minute per IP
- Sliding window
- In-memory tracking

### Input Validation
- Server-side validation for all inputs
- Length limits on all strings
- Type checking
- SQL injection prevention via ORM

---

## 🚀 Performance Optimizations

### Caching Strategy
1. **Memory Cache (LRU)** - Fastest, for hot data
2. **Request Deduplication** - Prevents concurrent duplicates
3. **CDN Cache** - For public APIs (cities, weather)

### Database Optimization
- Indexed foreign keys (user_id, trip_id)
- Selective field queries
- Batch operations where possible
- Efficient sorting and filtering

### API Response
- Gzip compression (automatic via Vercel)
- Minimal JSON payloads
- Efficient serialization

---

## 📱 Frontend Integration

### React Hooks
- `useTrips()` - Trip collection management
- `useTripDetail(tripId)` - Single trip with items
- `usePackingList()` - Local packing list state
- `useTripStats()` - User statistics

### Components
- `AuthModal` - Login/register/guest
- `TripForm` - Create/edit trips
- `PackingList` - Display and manage items
- `CitySearchInput` - Search cities with debouncing

---

## 🔗 Related Files

### API Routes
- `/workspace/src/app/api/` - All API endpoints

### Utilities
- `/workspace/src/lib/cache.ts` - Caching system
- `/workspace/src/lib/api-utils.ts` - API helpers
- `/workspace/src/lib/auth-utils-server.ts` - Auth helpers
- `/workspace/src/lib/openai.ts` - OpenAI integration

### Hooks
- `/workspace/src/hooks/useTrips.ts`
- `/workspace/src/hooks/useTripDetail.ts`
- `/workspace/src/hooks/usePackingList.ts`

### Types
- `/workspace/src/types/index.ts` - TypeScript definitions

---

## 🎯 Best Practices

### When Calling APIs
1. ✅ Always handle loading states
2. ✅ Display user-friendly error messages
3. ✅ Implement retry logic for network errors
4. ✅ Use optimistic updates for better UX
5. ✅ Debounce search inputs (300ms recommended)
6. ✅ Show progress indicators for slow operations

### Cache Management
1. ✅ Use cache for expensive operations (AI, external APIs)
2. ✅ Set appropriate TTLs based on data volatility
3. ✅ Implement request deduplication for concurrent requests
4. ✅ Clear cache on user actions that invalidate data

### Error Handling
1. ✅ Use error codes for programmatic handling
2. ✅ Provide user-friendly messages
3. ✅ Log errors with context for debugging
4. ✅ Implement graceful degradation

---

*For detailed implementation analysis, see `API_COMPREHENSIVE_ANALYSIS.md`*
