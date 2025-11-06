# Travel Assistant - Technical Architecture

Complete technical architecture and implementation details for the Travel Assistant application.

---

## System Overview

The Travel Assistant is built using modern web technologies with a focus on performance, scalability, and maintainability.

### Tech Stack

- **Frontend**: Next.js 15 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: OpenAI GPT-3.5-turbo
- **Authentication**: Custom auth with Supabase
- **State Management**: React Hooks with Context API
- **Icons**: Lucide React
- **Testing**: Jest, React Testing Library, Playwright
- **Hosting**: Vercel (recommended)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Browser)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Home Page   │  │  /trips      │  │  /trips/[id]             │  │
│  │  (/)         │  │  (History)   │  │  (Trip Detail)           │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────────────────┘  │
│         │                  │                  │                       │
│         └──────────────────┴──────────────────┘                       │
│                            │                                          │
│                            ▼                                          │
│         ┌──────────────────────────────────────────┐                 │
│         │         React Hooks & State              │                 │
│         │  • useTrips()      • useTripDetail()     │                 │
│         │  • useTripAutoSave() • useTripStats()    │                 │
│         └──────────────┬───────────────────────────┘                 │
│                        │                                              │
└────────────────────────┼──────────────────────────────────────────────┘
                         │
                         │ HTTP Requests
                         │
┌────────────────────────┼──────────────────────────────────────────────┐
│                        ▼           API LAYER (Next.js)                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    API Routes                                │    │
│  │                                                              │    │
│  │  POST   /api/trips              → Create trip               │    │
│  │  GET    /api/trips              → List trips                │    │
│  │  GET    /api/trips/[id]         → Get trip detail           │    │
│  │  PUT    /api/trips/[id]         → Update trip               │    │
│  │  DELETE /api/trips/[id]         → Delete trip               │    │
│  │  POST   /api/trips/[id]/duplicate → Duplicate trip          │    │
│  │  GET    /api/trips/stats        → Get statistics            │    │
│  │                                                              │    │
│  │  POST   /api/trips/[id]/items   → Add packing item          │    │
│  │  GET    /api/trips/[id]/items   → List items                │    │
│  │  PUT    /api/trips/[id]/items/[itemId] → Update item        │    │
│  │  DELETE /api/trips/[id]/items/[itemId] → Delete item        │    │
│  │                                                              │    │
│  └────────────────────────┬─────────────────────────────────────┘    │
│                           │                                           │
│  ┌────────────────────────┴──────────────────────────┐               │
│  │         Middleware & Validation Layer             │               │
│  │  • Authentication check (non-guest required)      │               │
│  │  • Authorization (user owns trip)                 │               │
│  │  • Input validation & sanitization                │               │
│  │  • Rate limiting                                  │               │
│  │  • Error handling                                 │               │
│  └────────────────────────┬──────────────────────────┘               │
│                           │                                           │
└───────────────────────────┼───────────────────────────────────────────┘
                            │
                            │ Database Queries
                            │
┌───────────────────────────┼───────────────────────────────────────────┐
│                           ▼        DATABASE (Supabase)                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   ┌──────────────────┐          ┌──────────────────────┐            │
│   │   users          │          │   trips              │            │
│   ├──────────────────┤          ├──────────────────────┤            │
│   │ • id (PK)        │◄─────────│ • id (PK)            │            │
│   │ • username       │ 1      * │ • user_id (FK)       │            │
│   │ • password       │          │ • destination info   │            │
│   │ • is_guest       │          │ • duration           │            │
│   │ • created_at     │          │ • trip_type          │            │
│   └──────────────────┘          │ • status             │            │
│                                 │ • dates              │            │
│                                 │ • notes              │            │
│                                 └──────────┬───────────┘            │
│                                            │                         │
│                                            │ 1                       │
│                                            │                         │
│                                            │ *                       │
│                                 ┌──────────▼───────────┐             │
│                                 │   packing_items      │             │
│                                 ├──────────────────────┤             │
│                                 │ • id (PK)            │             │
│                                 │ • trip_id (FK)       │             │
│                                 │ • name               │             │
│                                 │ • category           │             │
│                                 │ • essential          │             │
│                                 │ • packed             │             │
│                                 │ • custom             │             │
│                                 │ • quantity           │             │
│                                 └──────────────────────┘             │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── guest/route.ts
│   │   ├── trips/                # Trip management
│   │   │   ├── route.ts
│   │   │   ├── [id]/route.ts
│   │   │   ├── [id]/items/route.ts
│   │   │   ├── [id]/items/[itemId]/route.ts
│   │   │   ├── [id]/duplicate/route.ts
│   │   │   └── stats/route.ts
│   │   ├── cities/route.ts       # City search
│   │   ├── weather/route.ts      # Weather forecast
│   │   └── generate-packing-list/route.ts
│   ├── page.tsx                  # Home page (trip setup)
│   ├── packing-list/page.tsx     # Packing list page
│   ├── trips/                    # Trip pages
│   │   ├── page.tsx              # Trip history
│   │   └── [id]/page.tsx         # Trip detail
│   ├── completion/page.tsx       # Trip completion
│   ├── simple/page.tsx           # Simple interface
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
│
├── components/
│   ├── auth/                     # Authentication
│   │   └── AuthModal.tsx
│   ├── forms/                    # Form components
│   │   └── TripForm.tsx
│   ├── layout/                   # Layout components
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── packing/                  # Packing list components
│   │   ├── PackingList.tsx
│   │   └── PackingItem.tsx
│   ├── trips/                    # Trip components
│   │   ├── TripCard.tsx
│   │   ├── TripFilters.tsx
│   │   ├── TripStats.tsx
│   │   └── TripDetail.tsx
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Checkbox.tsx
│   │   ├── CitySearchInput.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Select.tsx
│   │   ├── Toast.tsx
│   │   └── WeatherForecast.tsx
│   └── ErrorBoundary.tsx
│
├── hooks/                        # Custom React hooks
│   ├── useAsyncState.ts
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   ├── usePackingList.ts
│   ├── useTripAutoSave.ts
│   ├── useTripDetail.ts
│   ├── useTrips.ts
│   └── useTripStats.ts
│
├── lib/                          # Utility libraries
│   ├── auth-utils.ts             # Auth validation
│   ├── cache.ts                  # Caching utilities
│   ├── db.ts                     # Database utilities
│   ├── openai.ts                 # OpenAI integration
│   ├── supabase.ts               # Supabase client
│   ├── utils.ts                  # General utilities
│   ├── validation.ts             # Input validation
│   └── weather.ts                # Weather API
│
└── types/                        # TypeScript types
    ├── index.ts                  # Main types
    └── database.ts               # Database types
```

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NULL,                -- Nullable for guest users
  is_guest BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_guest_username ON users(username) WHERE is_guest = true;
```

### Trips Table

```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  destination_country TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  duration INTEGER NOT NULL,
  trip_type TEXT NOT NULL,
  status TEXT DEFAULT 'active',      -- active, completed, archived
  departure_date DATE,
  return_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_user_status ON trips(user_id, status);
CREATE INDEX idx_trips_created_at ON trips(created_at DESC);
```

### Packing Items Table

```sql
CREATE TABLE packing_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  essential BOOLEAN DEFAULT false,
  packed BOOLEAN DEFAULT false,
  custom BOOLEAN DEFAULT false,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ           -- Soft delete
);

CREATE INDEX idx_packing_items_trip_id ON packing_items(trip_id);
CREATE INDEX idx_packing_items_trip_deleted ON packing_items(trip_id, deleted_at);
```

### Guest Counter Table

```sql
CREATE TABLE guest_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  counter INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Function to get next guest number
CREATE OR REPLACE FUNCTION get_next_guest_number()
RETURNS INTEGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  UPDATE guest_counter 
  SET counter = counter + 1,
      updated_at = now()
  WHERE id = 1 
  RETURNING counter INTO next_num;
  
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;
```

---

## Component Architecture

### Component Hierarchy

```
App (Layout)
│
├─── Header
│    ├─── Logo
│    ├─── Navigation
│    │    ├─── Home Link
│    │    ├─── My Trips Link
│    │    └─── User Menu
│    └─── AuthModal (conditional)
│
├─── Home Page (/)
│    ├─── TripForm
│    └─── RecentTripsWidget
│
├─── Trip History Page (/trips)
│    ├─── TripFilters
│    ├─── TripStatistics
│    └─── TripGrid
│         └─── TripCard × N
│
├─── Trip Detail Page (/trips/[id])
│    ├─── TripHeader
│    ├─── TripMetadata
│    ├─── PackingProgress
│    └─── PackingList
│         └─── PackingItem × N
│
└─── Packing List Page (/packing-list)
     ├─── AutoSaveIndicator
     ├─── WeatherForecast
     ├─── ProgressBar
     └─── PackingList
```

### State Management

```typescript
// Global State (Context)
interface AuthContext {
  currentUser: User | null
  isGuest: boolean
  login: (credentials: Credentials) => Promise<void>
  logout: () => void
}

interface TripContext {
  currentTrip: Trip | null
  setCurrentTrip: (trip: Trip) => void
  isDirty: boolean
  saveTrip: () => Promise<void>
}

// Page-Level State (Hooks)
interface TripsState {
  trips: Trip[]
  filters: TripFilters
  isLoading: boolean
  error: string | null
  fetchTrips: () => Promise<void>
  createTrip: (trip: TripData) => Promise<Trip>
  deleteTrip: (id: string) => Promise<void>
}

interface TripDetailState {
  trip: Trip | null
  packingItems: PackingItem[]
  isLoading: boolean
  error: string | null
  updateTrip: (updates: Partial<Trip>) => Promise<void>
  addItem: (item: PackingItemData) => Promise<void>
  updateItem: (id: string, updates: Partial<PackingItem>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
}
```

---

## Data Flow

### Create New Trip Flow

```
User fills form → Click "Create Packing List"
      ↓
Check authentication
      ↓
  [Guest User]              [Registered User]
      ↓                           ↓
Save to localStorage       POST /api/trips
      ↓                           ↓
Navigate to               Insert into database
/packing-list                   ↓
                          Generate AI list
                                ↓
                          Save items to DB
                                ↓
                          Navigate to /packing-list
```

### Auto-Save Flow

```
User modifies item
      ↓
Update local state (optimistic)
      ↓
Debounce timer (2 seconds)
      ↓
PUT /api/trips/[id]/items/[itemId]
      ↓
Database UPDATE
      ↓
Success → Show "Saved at [time]"
Failure → Show retry button
```

### Authentication Flow

```
Request → API Route
      ↓
Verify Auth Token
      ↓
Check User Status
      ↓
[Not Auth] → 401        [Guest] → 403        [Registered] → Continue
      ↓                      ↓                        ↓
Redirect to login    "Guests can't save"    Validate ownership
                                                    ↓
                                              Execute action
```

---

## Caching Strategy

### Multi-Level Caching

```
Layer 1: Client-Side (React Query / SWR)
• Trip list: 5 min TTL, stale-while-revalidate
• Trip detail: 1 min TTL, stale-while-revalidate
• Statistics: 1 hour TTL
• On mutation: Invalidate related queries

Layer 2: API Response Cache (Server-Side)
• LRU Cache for expensive queries
• Cache key includes user_id + query params
• Invalidate on write operations

Layer 3: Database Query Cache (Supabase)
• Built-in PostgreSQL query cache
• Automatic based on query plans
```

### Cache Invalidation Rules

- Create trip → Invalidate trip list cache
- Update trip → Invalidate trip detail + list cache
- Delete trip → Invalidate list + statistics cache
- Update item → Invalidate trip detail cache

---

## Performance Optimizations

### Database Level

- **Indexes**: On frequently queried columns (user_id, status, created_at)
- **Pagination**: Limit queries with offset/limit
- **Select Optimization**: Only fetch needed columns
- **Connection Pooling**: Reuse database connections

### API Level

- **Response Caching**: LRU cache with TTL
- **Request Deduplication**: Prevent duplicate API calls
- **Batch Operations**: Multiple updates in single request
- **Compression**: Gzip large responses

### Frontend Level

- **Code Splitting**: Lazy load routes
- **Virtual Scrolling**: Efficient large list rendering
- **Optimistic Updates**: Instant UI feedback
- **Debounced Inputs**: Reduce API calls (search, auto-save)
- **Memoized Components**: React.memo for expensive renders
- **Image Optimization**: Next.js automatic optimization

### Performance Targets

- API response time: < 200ms (p95)
- Page load time: < 2 seconds
- Time to interactive: < 3 seconds
- Auto-save latency: < 500ms
- Database query time: < 100ms

---

## Security Architecture

### Security Layers

1. **Client-Side Validation**
   - Form validation (types, lengths, formats)
   - Prevent XSS in user inputs
   - CSRF token in forms

2. **API Authentication**
   - JWT or session-based auth
   - Verify token on every request
   - Check non-guest status for write operations

3. **Authorization**
   - Verify user owns resource (trip)
   - Check permissions for action
   - Rate limiting per user

4. **Database Security**
   - Row Level Security (RLS) policies
   - Parameterized queries (prevent SQL injection)
   - Encrypted connections

5. **Infrastructure**
   - HTTPS only
   - Secure headers (HSTS, CSP, etc.)
   - Environment variables for secrets
   - Regular security audits

### Security Checklist

✓ Passwords hashed with bcrypt  
✓ API endpoints authenticated  
✓ User ownership verified  
✓ Input validated and sanitized  
✓ RLS policies enabled  
✓ Rate limiting implemented  
✓ HTTPS enforced  
✓ Secrets in environment variables  
✓ Regular dependency updates  
✓ Error messages don't leak info  

---

## Error Handling

### Error Classification

```
Error Type → Handler
│
├─ Network Error → Auto-retry with backoff, Queue offline
├─ Validation Error → Show inline errors, Prevent submission
├─ Auth Error → Redirect to login, Clear session
├─ Not Found → Show 404 message, Suggest alternatives
└─ Server Error → Show error + log, Retry button, Report to tracking
```

### Error Response Format

```typescript
interface ErrorResponse {
  error: string                    // Human-readable message
  code: string                     // ERROR_CODE_CONSTANT
  details?: Record<string, any>    // Optional context
  retry: boolean                   // Whether to retry
}
```

---

## Testing Strategy

### Test Types

1. **Unit Tests** (Jest + React Testing Library)
   - Component rendering
   - Hook behavior
   - Utility functions
   - Validation logic

2. **Integration Tests**
   - API route handlers
   - Database operations
   - Authentication flows
   - Data transformations

3. **E2E Tests** (Playwright)
   - Complete user flows
   - Cross-browser testing
   - Mobile responsiveness
   - Accessibility checks

### Test Coverage Targets

- **Lines**: 70%+
- **Functions**: 70%+
- **Branches**: 70%+
- **Statements**: 70%+

---

## Deployment Architecture

```
                    ┌─────────────────┐
                    │   Vercel CDN    │
                    │   (Static files)│
                    └────────┬────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
   ┌──────▼──────┐                      ┌──────▼──────┐
   │  Next.js    │                      │   API       │
   │  Frontend   │                      │  Routes     │
   │  (Vercel)   │                      │  (Vercel)   │
   └─────────────┘                      └──────┬──────┘
                                               │
                                        ┌──────▼──────┐
                                        │  Supabase   │
                                        │  PostgreSQL │
                                        └─────────────┘
```

### Environment Variables

```env
# Production
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
OPENAI_API_KEY=your-key
DATABASE_URL=your-connection-string (optional)
```

### Monitoring

- Vercel Analytics
- Supabase Dashboard
- Error tracking (Sentry)
- Performance monitoring
- Database query logs

---

## Migration Strategies

### LocalStorage → Database

```
Check localStorage data
      ↓
Show migration prompt
      ↓
User accepts
      ↓
Create trip in DB
      ↓
Create items in DB
      ↓
Clear localStorage
      ↓
Show success toast
```

### Rollback Plan

1. **Assess Impact**: User count, data loss risk
2. **Immediate Actions**: Disable features, Show banner, Log errors
3. **Rollback Options**:
   - Database rollback + restore backup
   - Code rollback + keep database
   - Feature flag disable + fallback
4. **Communication**: Notify users, Update status, Provide ETA
5. **Post-Mortem**: Document issues, Improve testing, Update checklist

---

## API Documentation

See [API.md](./API.md) for complete API endpoint documentation.

---

## Further Reading

- **Features**: See [FEATURES.md](./FEATURES.md)
- **Setup**: See [SETUP.md](./SETUP.md)
- **Testing**: See [TESTING.md](./TESTING.md)
- **Contributing**: See [CONTRIBUTING.md](./CONTRIBUTING.md)

---

**Built with ❤️ using modern web technologies and best practices.**
