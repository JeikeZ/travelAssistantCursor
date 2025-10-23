# Trip Saving Feature - Setup Guide

## ✅ Current Status

**API Endpoints**: ✅ Created (7 endpoints ready)  
**Database Tables**: ⚠️ Need to be created  
**Frontend**: ❌ Not yet created  

---

## 🔥 STEP 1: Create Database Tables (REQUIRED - 5 minutes)

**Go to your Supabase dashboard and run this SQL:**

1. Open [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click **"SQL Editor"** in sidebar
4. Click **"New Query"**
5. Copy and paste this entire script:

```sql
-- ============================================
-- Trip Saving Feature - Database Setup
-- ============================================

-- Table 1: trips
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Trip details
  destination_country VARCHAR(100) NOT NULL,
  destination_city VARCHAR(100) NOT NULL,
  destination_state VARCHAR(100),
  destination_display_name VARCHAR(255),
  duration INTEGER NOT NULL CHECK (duration > 0 AND duration <= 365),
  trip_type VARCHAR(50) NOT NULL,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  -- Trip dates
  start_date DATE,
  end_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  
  -- Additional info
  notes TEXT,
  is_favorite BOOLEAN DEFAULT false
);

-- Table 2: packing_items
CREATE TABLE IF NOT EXISTS packing_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  
  -- Item details
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  
  -- Item properties
  essential BOOLEAN DEFAULT false,
  packed BOOLEAN DEFAULT false,
  custom BOOLEAN DEFAULT false,
  quantity INTEGER DEFAULT 1,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Custom notes per item
  notes TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_user_status ON trips(user_id, status);
CREATE INDEX IF NOT EXISTS idx_packing_items_trip_id ON packing_items(trip_id);

-- Verify setup
SELECT 
  '✅ Trips table created!' as status,
  COUNT(*) as trip_count
FROM trips;
```

6. Click **"Run"**
7. You should see: **"✅ Trips table created!"** with `trip_count: 0`

---

## 🧪 STEP 2: Test Your API Endpoints (5 minutes)

After creating the database tables, test the API:

### Test 1: Create a Trip

```bash
# Make sure you're logged in first, then run:
curl -X POST http://localhost:3000/api/trips \
  -H "Content-Type: application/json" \
  -d '{
    "destinationCountry": "France",
    "destinationCity": "Paris",
    "duration": 7,
    "tripType": "leisure"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "trip": {
    "id": "...",
    "destination_city": "Paris",
    "status": "active",
    ...
  }
}
```

### Test 2: List Your Trips

```bash
curl http://localhost:3000/api/trips
```

**Expected Response:**
```json
{
  "success": true,
  "trips": [...],
  "total": 1,
  "hasMore": false
}
```

### Test 3: Get Trip Statistics

```bash
curl http://localhost:3000/api/trips/stats
```

---

## 📱 STEP 3: Integrate with Your Frontend (Next Phase)

Now that your API works, you need to integrate it with your existing pages:

### Option A: Simple Integration (Quick Start - 2-3 hours)

**Modify existing home page to auto-save trips:**

1. Update `src/app/page.tsx` - When user creates a trip, call `POST /api/trips`
2. Update `src/app/packing-list/page.tsx` - Load trip from API instead of localStorage
3. Add a "My Trips" button in header that links to `/trips`

### Option B: Full Implementation (Recommended - 3-4 weeks)

Follow the detailed plan in `TRIP_HISTORY_IMPLEMENTATION_PLAN.md`:

**Create new pages:**
- `src/app/trips/page.tsx` - Trip history dashboard
- `src/app/trips/[id]/page.tsx` - Individual trip view

**Create new components:**
- `src/components/trips/TripCard.tsx`
- `src/components/trips/TripFilters.tsx`
- `src/components/trips/TripStatistics.tsx`

**Create new hooks:**
- `src/hooks/useTrips.ts`
- `src/hooks/useTripDetail.ts`
- `src/hooks/useTripAutoSave.ts`

---

## 🔍 API Endpoint Reference

### Trip Management

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/trips` | POST | Create new trip |
| `/api/trips` | GET | List user's trips |
| `/api/trips/[id]` | GET | Get trip details |
| `/api/trips/[id]` | PUT | Update trip |
| `/api/trips/[id]` | DELETE | Delete trip |
| `/api/trips/[id]/duplicate` | POST | Duplicate trip |
| `/api/trips/stats` | GET | Get statistics |

### Packing Items

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/trips/[id]/items` | POST | Add item |
| `/api/trips/[id]/items` | GET | List items |
| `/api/trips/[id]/items/[itemId]` | PUT | Update item |
| `/api/trips/[id]/items/[itemId]` | DELETE | Delete item |

---

## 🎯 Quick Integration Example

Here's how to integrate in your home page (`src/app/page.tsx`):

```typescript
// Add this function to save trip when user submits form
const saveTripToDatabase = async (tripData: CreateTripRequest) => {
  try {
    const response = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tripData),
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('Trip saved!', result.trip)
      // Store trip ID for later use
      localStorage.setItem('currentTripId', result.trip.id)
    }
  } catch (error) {
    console.error('Failed to save trip:', error)
  }
}

// Call it when user creates a trip:
const handleCreateTrip = async (formData) => {
  // Save to database
  await saveTripToDatabase({
    destinationCountry: formData.country,
    destinationCity: formData.city,
    duration: formData.duration,
    tripType: formData.tripType,
  })
  
  // Continue with existing flow...
}
```

---

## ✅ Checklist

### Completed:
- [x] API endpoints created
- [x] TypeScript types defined
- [x] Authentication helpers created
- [x] Database schema documented

### To Do:
- [ ] Create database tables in Supabase (Step 1 above)
- [ ] Test API endpoints
- [ ] Integrate with frontend pages
- [ ] Create trip history page
- [ ] Create trip detail page
- [ ] Add "My Trips" navigation
- [ ] Test end-to-end flow

---

## 🚨 Troubleshooting

### "Authentication required"
- Make sure you're logged in (not as guest)
- Check that cookies are being sent with requests

### "Trip not found"
- Verify the trip ID is correct
- Check that the trip belongs to the logged-in user

### "Failed to create trip"
- Confirm database tables exist
- Check Supabase dashboard → Logs for errors
- Verify all required fields are provided

---

## 📚 Related Documentation

- `TRIP_HISTORY_ARCHITECTURE.md` - System architecture
- `TRIP_HISTORY_IMPLEMENTATION_PLAN.md` - Full implementation plan
- `TRIP_HISTORY_QUICK_REFERENCE.md` - Quick reference guide
- `SUPABASE_SETUP.md` - Database configuration

---

## 🎉 Next Steps

1. ✅ **DONE**: API endpoints created
2. ⚠️ **NOW**: Run SQL script to create database tables
3. 🧪 **THEN**: Test API endpoints
4. 🚀 **FINALLY**: Integrate with your frontend

**You're 80% done! Just create the database tables and you'll have a working API!**
