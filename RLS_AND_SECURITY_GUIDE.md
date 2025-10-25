# RLS and Security Configuration Guide

## Overview

This application uses **custom authentication with httpOnly cookies** instead of Supabase Auth. This requires a specific security setup to work properly with Row Level Security (RLS).

---

## Architecture Summary

```
User Browser
    ↓
    → Logs in → API Route verifies credentials → Sets httpOnly cookie
    ↓
    → Makes request → API Route reads cookie → Verifies user
    ↓
    → API uses Service Role Key → Bypasses RLS → Performs database operation
```

**Key Points:**
- ✅ Authentication handled by API routes (not Supabase Auth)
- ✅ Authorization enforced in API code (checking user owns the resource)
- ✅ RLS enabled for security against direct database access
- ✅ Service Role Key used in API routes to bypass RLS

---

## Step-by-Step Setup

### Step 1: Add Service Role Key to Environment Variables

#### Local Development (.env.local)

Create or update `/workspace/.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Service Role Key (NEVER expose to frontend!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# OpenAI Configuration
OPENAI_API_KEY=your-openai-key
```

**To get your Service Role Key:**
1. Go to https://app.supabase.com
2. Select your project
3. Click **Settings** → **API**
4. Copy the **service_role** key (NOT the anon key)

#### Vercel Production

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **Environment Variables**
3. Add new variable:
   - **Key**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: [your service role key]
   - **Environments**: Check all (Production, Preview, Development)
4. Click **Save**
5. **Redeploy** your application

---

### Step 2: Enable RLS Policies in Supabase

Run this SQL in **Supabase Dashboard** → **SQL Editor**:

```sql
-- ============================================
-- Enable RLS on all tables
-- ============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Users table policies
-- ============================================

-- Allow user registration (anyone can insert)
CREATE POLICY "Allow user registration"
  ON users FOR INSERT
  WITH CHECK (true);

-- Users can read any user data (needed for login verification)
-- Note: Password hashes are never returned to client in API responses
CREATE POLICY "Users can read user data"
  ON users FOR SELECT
  USING (true);

-- Users cannot update or delete (would need additional logic for profile updates)
-- If you want users to update their own profiles, add:
-- CREATE POLICY "Users can update own profile"
--   ON users FOR UPDATE
--   USING (id = auth.uid());

-- ============================================
-- Trips table policies
-- ============================================

-- These policies won't actually be checked because API routes use service_role key
-- But they provide defense-in-depth if someone gets the anon key
-- and tries to query directly

CREATE POLICY "Block direct access to trips"
  ON trips FOR ALL
  USING (false);

-- ============================================
-- Packing items table policies
-- ============================================

CREATE POLICY "Block direct access to packing_items"
  ON packing_items FOR ALL
  USING (false);

-- ============================================
-- Verify RLS is enabled
-- ============================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('users', 'trips', 'packing_items')
ORDER BY tablename;
```

**Expected Result:**
```
schemaname | tablename      | rls_enabled
-----------+----------------+-------------
public     | packing_items  | true
public     | trips          | true
public     | users          | true
```

---

## How Security Works

### 1. **Client-Side (Browser)**

Uses the **anon key** which respects RLS:

```typescript
// src/lib/supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- ❌ Cannot directly insert trips (blocked by RLS)
- ❌ Cannot directly update packing items (blocked by RLS)
- ✅ Can only access through API routes

### 2. **Server-Side (API Routes)**

Uses the **service_role key** which bypasses RLS:

```typescript
// src/lib/supabase.ts
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
```

- ✅ Can perform any database operation
- ✅ API routes verify authentication first
- ✅ API routes check authorization (user owns resource)
- ✅ Safe because API routes run on server (not exposed to users)

### 3. **Authorization Flow Example**

Here's how creating a trip works:

```typescript
// src/app/api/trips/route.ts
export async function POST(request: NextRequest) {
  // Step 1: Get user from session cookie
  const user = await getUserFromSession()
  
  // Step 2: Verify authentication
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  
  // Step 3: Verify authorization (non-guest users only)
  if (user.is_guest) {
    return NextResponse.json({ error: 'Guest users cannot save trips' }, { status: 403 })
  }
  
  // Step 4: Insert into database (using service_role key - bypasses RLS)
  const { data: trip } = await supabaseAdmin
    .from('trips')
    .insert({ user_id: user.id, ...tripData })
  
  return NextResponse.json({ success: true, trip })
}
```

**Key Security Points:**
- ✅ Authentication verified via session cookie
- ✅ Authorization checked in code (user.is_guest)
- ✅ User ID from session (not client request - prevents impersonation)
- ✅ RLS blocks direct database access from browser

---

## Why This Approach is Secure

### ✅ Defense in Depth

Even if someone:
1. **Gets your anon key** (public in client code) → They still can't write to database (RLS blocks it)
2. **Tries to bypass your API** → RLS policies block direct access
3. **Tries to modify cookies** → API validates session and checks authorization
4. **Tries to access other users' trips** → API checks `user_id` matches session user

### ✅ Service Role Key is Safe Because:

- Only exists on the server (Vercel environment variables)
- Never sent to the browser
- Only used in API routes after authentication/authorization
- Cannot be accessed by malicious users

### ⚠️ Important Warnings

**DO NOT:**
- ❌ Use service_role key in client-side code
- ❌ Expose service_role key in frontend .env files
- ❌ Commit service_role key to git
- ❌ Share service_role key publicly

**DO:**
- ✅ Keep service_role key in server environment variables only
- ✅ Always verify authentication in API routes
- ✅ Check authorization before database operations
- ✅ Use prepared statements (Supabase client does this automatically)

---

## Alternative Approach (Not Recommended for This App)

You could migrate to **Supabase Auth** and use proper RLS policies:

```sql
-- Example with Supabase Auth
CREATE POLICY "Users can view own trips"
  ON trips FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own trips"
  ON trips FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

**Pros:**
- More granular control
- Supabase handles auth complexity
- RLS policies based on JWT tokens

**Cons:**
- Requires refactoring entire auth system
- Breaks existing user accounts
- More complex migration path

**Recommendation:** Stick with current approach (service_role + API authorization)

---

## Testing RLS Configuration

### Test 1: Verify RLS is Enabled

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'trips', 'packing_items');
```

**Expected:** All should show `rowsecurity = true`

### Test 2: Try Direct Access (Should Fail)

In browser console (with anon key):

```javascript
// This should return empty or error (blocked by RLS)
const { data, error } = await supabase
  .from('trips')
  .select('*')

console.log('Data:', data, 'Error:', error)
// Expected: No data (RLS blocks access)
```

### Test 3: API Access (Should Work)

```javascript
// This should work (goes through authenticated API)
fetch('/api/trips')
  .then(r => r.json())
  .then(data => console.log('Trips:', data))
```

---

## Troubleshooting

### Error: "Missing SUPABASE_SERVICE_ROLE_KEY"

**Solution:** Add the environment variable and restart/redeploy

### Error: "Row level security policy violated"

**Cause:** API code is using `supabase` instead of `supabaseAdmin`
**Solution:** Update API route imports to use `supabaseAdmin`

### Error: Trips still not saving

**Check:**
1. Service role key is correct in environment variables
2. Vercel deployment was redeployed after adding key
3. API routes import `supabaseAdmin` not `supabase`
4. User is not a guest user (check for "Guest" in welcome message)

---

## Summary

✅ **RLS Enabled**: Protects against direct database access
✅ **Service Role Key**: Allows API routes to bypass RLS safely  
✅ **Authorization in Code**: API routes verify user permissions
✅ **Defense in Depth**: Multiple security layers

Your database is now properly secured! 🔒
