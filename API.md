# API Documentation

Complete API reference for the Travel Assistant application.

---

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

---

## Authentication

Most API endpoints require authentication. Include session information in cookies or headers.

### Authentication Header

```http
Cookie: session=<session-token>
```

### Response Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (authenticated but not authorized)
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "SecurePass123"
}
```

**Validation:**
- Username: 3+ characters, alphanumeric and underscores
- Password: 8+ characters, 1 uppercase, 1 lowercase

**Success Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "is_guest": false,
    "created_at": "2025-11-06T10:00:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Password must be at least 8 characters long"
}
```

**Error Response (409):**
```json
{
  "success": false,
  "error": "Username already exists. Please choose a different username."
}
```

---

### Login User

Authenticate an existing user.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "is_guest": false,
    "created_at": "2025-11-06T10:00:00Z"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "The username or password entered is incorrect."
}
```

---

### Guest Login

Create a guest account for temporary access.

**Endpoint:** `POST /api/auth/guest`

**Request Body:** None

**Success Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "guest_user123",
    "is_guest": true,
    "created_at": "2025-11-06T10:00:00Z"
  }
}
```

---

## Trip Endpoints

### Create Trip

Create a new trip with packing list.

**Endpoint:** `POST /api/trips`

**Authentication:** Required (non-guest)

**Request Body:**
```json
{
  "destination_country": "France",
  "destination_city": "Paris",
  "duration": 7,
  "trip_type": "leisure",
  "departure_date": "2025-12-01",
  "return_date": "2025-12-08",
  "notes": "Anniversary trip"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "trip": {
    "id": "uuid",
    "user_id": "uuid",
    "destination_country": "France",
    "destination_city": "Paris",
    "duration": 7,
    "trip_type": "leisure",
    "status": "active",
    "departure_date": "2025-12-01",
    "return_date": "2025-12-08",
    "notes": "Anniversary trip",
    "created_at": "2025-11-06T10:00:00Z",
    "updated_at": "2025-11-06T10:00:00Z"
  },
  "packing_items": [
    {
      "id": "uuid",
      "trip_id": "uuid",
      "name": "Passport",
      "category": "documents",
      "essential": true,
      "packed": false,
      "custom": false,
      "quantity": 1
    }
  ]
}
```

---

### List Trips

Get all trips for the authenticated user.

**Endpoint:** `GET /api/trips`

**Authentication:** Required (non-guest)

**Query Parameters:**
- `status` - Filter by status: `all`, `active`, `completed`, `archived` (default: `all`)
- `limit` - Number of trips to return (default: 50)
- `offset` - Number of trips to skip (default: 0)
- `sort` - Sort field: `created_at`, `departure_date`, `updated_at` (default: `created_at`)
- `order` - Sort order: `asc`, `desc` (default: `desc`)

**Example:**
```
GET /api/trips?status=active&limit=10&sort=departure_date&order=asc
```

**Success Response (200):**
```json
{
  "success": true,
  "trips": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "destination_country": "France",
      "destination_city": "Paris",
      "duration": 7,
      "trip_type": "leisure",
      "status": "active",
      "departure_date": "2025-12-01",
      "return_date": "2025-12-08",
      "notes": "Anniversary trip",
      "created_at": "2025-11-06T10:00:00Z",
      "updated_at": "2025-11-06T10:00:00Z",
      "stats": {
        "total_items": 25,
        "packed_items": 10,
        "completion_percentage": 40
      }
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

---

### Get Trip Detail

Get a specific trip with all packing items.

**Endpoint:** `GET /api/trips/[id]`

**Authentication:** Required (non-guest, must own trip)

**Success Response (200):**
```json
{
  "success": true,
  "trip": {
    "id": "uuid",
    "user_id": "uuid",
    "destination_country": "France",
    "destination_city": "Paris",
    "duration": 7,
    "trip_type": "leisure",
    "status": "active",
    "departure_date": "2025-12-01",
    "return_date": "2025-12-08",
    "notes": "Anniversary trip",
    "created_at": "2025-11-06T10:00:00Z",
    "updated_at": "2025-11-06T10:00:00Z"
  },
  "packing_items": [
    {
      "id": "uuid",
      "trip_id": "uuid",
      "name": "Passport",
      "category": "documents",
      "essential": true,
      "packed": false,
      "custom": false,
      "quantity": 1,
      "notes": null,
      "created_at": "2025-11-06T10:00:00Z",
      "updated_at": "2025-11-06T10:00:00Z"
    }
  ]
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Trip not found"
}
```

---

### Update Trip

Update trip details.

**Endpoint:** `PUT /api/trips/[id]`

**Authentication:** Required (non-guest, must own trip)

**Request Body:**
```json
{
  "notes": "Updated notes",
  "status": "completed",
  "departure_date": "2025-12-02"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "trip": {
    "id": "uuid",
    "notes": "Updated notes",
    "status": "completed",
    "departure_date": "2025-12-02",
    "updated_at": "2025-11-06T11:00:00Z"
  }
}
```

---

### Delete Trip

Delete a trip and all associated packing items.

**Endpoint:** `DELETE /api/trips/[id]`

**Authentication:** Required (non-guest, must own trip)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Trip deleted successfully"
}
```

---

### Duplicate Trip

Create a copy of an existing trip.

**Endpoint:** `POST /api/trips/[id]/duplicate`

**Authentication:** Required (non-guest, must own trip)

**Request Body:**
```json
{
  "departure_date": "2026-01-15",
  "return_date": "2026-01-22"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "trip": {
    "id": "new-uuid",
    "destination_country": "France",
    "destination_city": "Paris",
    "duration": 7,
    "trip_type": "leisure",
    "status": "active",
    "departure_date": "2026-01-15",
    "return_date": "2026-01-22",
    "notes": "Duplicated from previous trip",
    "created_at": "2025-11-06T12:00:00Z"
  },
  "packing_items": [...]
}
```

---

### Get Trip Statistics

Get aggregate statistics for user's trips.

**Endpoint:** `GET /api/trips/stats`

**Authentication:** Required (non-guest)

**Success Response (200):**
```json
{
  "success": true,
  "stats": {
    "total_trips": 15,
    "active_trips": 3,
    "completed_trips": 12,
    "archived_trips": 0,
    "countries_visited": 8,
    "total_items_packed": 387,
    "average_duration": 6.2,
    "completion_rate": 0.85,
    "trip_types": {
      "leisure": 10,
      "business": 3,
      "beach": 2
    }
  }
}
```

---

## Packing Item Endpoints

### Add Packing Item

Add a new item to a trip's packing list.

**Endpoint:** `POST /api/trips/[id]/items`

**Authentication:** Required (non-guest, must own trip)

**Request Body:**
```json
{
  "name": "Sunscreen",
  "category": "toiletries",
  "essential": true,
  "quantity": 1,
  "notes": "SPF 50+"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "item": {
    "id": "uuid",
    "trip_id": "uuid",
    "name": "Sunscreen",
    "category": "toiletries",
    "essential": true,
    "packed": false,
    "custom": true,
    "quantity": 1,
    "notes": "SPF 50+",
    "created_at": "2025-11-06T10:00:00Z"
  }
}
```

---

### List Packing Items

Get all packing items for a trip.

**Endpoint:** `GET /api/trips/[id]/items`

**Authentication:** Required (non-guest, must own trip)

**Query Parameters:**
- `category` - Filter by category
- `packed` - Filter by packed status: `true`, `false`, `all` (default: `all`)
- `essential` - Filter essential items only: `true`, `false`

**Example:**
```
GET /api/trips/abc123/items?category=clothing&packed=false
```

**Success Response (200):**
```json
{
  "success": true,
  "items": [
    {
      "id": "uuid",
      "trip_id": "uuid",
      "name": "T-Shirts",
      "category": "clothing",
      "essential": false,
      "packed": false,
      "custom": false,
      "quantity": 5
    }
  ]
}
```

---

### Update Packing Item

Update a packing item.

**Endpoint:** `PUT /api/trips/[id]/items/[itemId]`

**Authentication:** Required (non-guest, must own trip)

**Request Body:**
```json
{
  "packed": true,
  "quantity": 2,
  "notes": "Updated notes"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "item": {
    "id": "uuid",
    "packed": true,
    "quantity": 2,
    "notes": "Updated notes",
    "updated_at": "2025-11-06T11:00:00Z"
  }
}
```

---

### Delete Packing Item

Delete (soft delete) a packing item.

**Endpoint:** `DELETE /api/trips/[id]/items/[itemId]`

**Authentication:** Required (non-guest, must own trip)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Item deleted successfully"
}
```

---

## Utility Endpoints

### Search Cities

Search for cities by name.

**Endpoint:** `GET /api/cities`

**Authentication:** Not required

**Query Parameters:**
- `q` - Search query (minimum 2 characters)
- `limit` - Number of results (default: 10)

**Example:**
```
GET /api/cities?q=paris&limit=5
```

**Success Response (200):**
```json
{
  "success": true,
  "cities": [
    {
      "name": "Paris",
      "country": "France",
      "region": "Île-de-France",
      "latitude": 48.8566,
      "longitude": 2.3522
    }
  ]
}
```

---

### Get Weather Forecast

Get weather forecast for a destination.

**Endpoint:** `GET /api/weather`

**Authentication:** Not required

**Query Parameters:**
- `city` - City name (required)
- `country` - Country name (required)
- `days` - Number of forecast days (1-7, default: 5)

**Example:**
```
GET /api/weather?city=Paris&country=France&days=5
```

**Success Response (200):**
```json
{
  "success": true,
  "location": {
    "city": "Paris",
    "country": "France"
  },
  "current": {
    "temperature": 18,
    "feels_like": 16,
    "conditions": "Partly Cloudy",
    "humidity": 65,
    "wind_speed": 12
  },
  "forecast": [
    {
      "date": "2025-11-07",
      "temperature_high": 20,
      "temperature_low": 12,
      "conditions": "Sunny",
      "precipitation": 10,
      "wind_speed": 8
    }
  ]
}
```

---

### Generate Packing List

Generate AI-powered packing list recommendations.

**Endpoint:** `POST /api/generate-packing-list`

**Authentication:** Not required

**Request Body:**
```json
{
  "destination_country": "France",
  "destination_city": "Paris",
  "duration": 7,
  "trip_type": "leisure",
  "departure_date": "2025-12-01"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "items": [
    {
      "name": "Passport",
      "category": "documents",
      "essential": true,
      "quantity": 1,
      "reason": "Required for international travel"
    },
    {
      "name": "Light Jacket",
      "category": "clothing",
      "essential": false,
      "quantity": 1,
      "reason": "December in Paris can be cool"
    }
  ],
  "generated_by": "ai",
  "recommendations": [
    "Paris in December is typically cool and rainy",
    "Bring comfortable walking shoes for sightseeing",
    "Consider a universal power adapter"
  ]
}
```

**Fallback Response (when AI unavailable):**
```json
{
  "success": true,
  "items": [...],
  "generated_by": "fallback",
  "message": "AI service unavailable, using basic list"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### Common Error Codes

- `AUTH_REQUIRED` - Authentication required
- `INVALID_CREDENTIALS` - Wrong username/password
- `GUEST_FORBIDDEN` - Guests cannot perform this action
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Input validation failed
- `DUPLICATE_USERNAME` - Username already exists
- `TRIP_NOT_FOUND` - Trip doesn't exist
- `UNAUTHORIZED` - User doesn't own this resource
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

---

## Rate Limiting

API rate limits (per user):

- Authentication endpoints: 10 requests per minute
- Trip operations: 60 requests per minute
- Read operations: 100 requests per minute
- AI generation: 5 requests per minute

Rate limit headers:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1699276800
```

---

## Pagination

List endpoints support pagination:

**Request:**
```
GET /api/trips?limit=20&offset=40
```

**Response:**
```json
{
  "success": true,
  "trips": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 40,
    "has_more": true
  }
}
```

---

## Webhooks

*(Future feature)*

Webhooks will be available for:
- Trip completed
- Packing list 100% complete
- Departure date approaching

---

## SDK / Client Libraries

Currently, use fetch or axios directly. Official SDKs planned for:
- JavaScript/TypeScript
- Python
- Mobile (React Native)

---

## API Versioning

Current version: `v1` (implicit)

Future versions will use URL versioning:
- `v1`: `/api/trips`
- `v2`: `/api/v2/trips`

---

## Support

For API questions:
- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- See [README.md](./README.md) for overview
- Open an issue on GitHub

---

**API Documentation Version 1.0 | Last Updated: 2025-11-06**
