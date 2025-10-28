# Row Level Security (RLS) Setup Guide

This guide explains how to configure Row Level Security (RLS) in Supabase to prevent users from seeing other users' trips.

## Overview

Your application now uses a **service role key** for all backend API operations. This means:
- ✅ Backend API routes bypass RLS (using service role key)
- ✅ Application-level security is enforced in code (filtering by `user_id`)
- ✅ RLS policies block unauthorized direct database access (via anon key)

## Why This Matters

Without RLS enabled, anyone with the anonymous key (which is public in your frontend code) could directly query your Supabase database and access all trips, bypassing your application's security checks.

## Implementation Steps

### Step 1: Add Service Role Key to Vercel

1. **Get Your Service Role Key**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Go to **Project Settings** → **API**
   - Copy the **`service_role`** key (⚠️ Keep this secret!)

2. **Add to Vercel Environment Variables**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project
   - Go to **Settings** → **Environment Variables**
   - Add a new variable:
     - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
     - **Value**: (paste your service role key)
     - **Environment**: Select all (Production, Preview, Development)
   - Click **Save**

3. **Redeploy Your Application**
   - Go to **Deployments** tab
   - Click the three dots (•••) on the latest deployment
   - Click **Redeploy**
   - Wait for deployment to complete

### Step 2: Enable RLS on Supabase Tables

Run these SQL commands in your Supabase SQL Editor:

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project
2. Click **SQL Editor** in the sidebar
3. Click **New Query**
4. Copy and paste the SQL below
5. Click **Run**

**SQL Commands:**

```sql
-- ================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ================================================

-- Enable RLS on trips table
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Enable RLS on packing_items table
ALTER TABLE packing_items ENABLE ROW LEVEL SECURITY;

-- Enable RLS on users table (optional but recommended)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;


-- ================================================
-- CREATE RESTRICTIVE RLS POLICIES
-- ================================================
-- These policies block all direct access via the anon key
-- The service role key (used by your API) bypasses these policies
-- ================================================

-- Trips Table Policies: Block all direct access
CREATE POLICY "Block direct access to trips"
  ON trips
  FOR ALL
  USING (false);

-- Packing Items Table Policies: Block all direct access
CREATE POLICY "Block direct access to packing_items"
  ON packing_items
  FOR ALL
  USING (false);

-- Users Table Policies: Allow reading own user data only
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  USING (id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can insert (for registration)
CREATE POLICY "Allow user registration"
  ON users
  FOR INSERT
  WITH CHECK (true);
```

### Step 3: Verify RLS is Working

1. **Check RLS Status**
   - In Supabase Dashboard, go to **Table Editor**
   - Click on the `trips` table
   - You should see "RLS enabled" indicator at the top

2. **Test Your Application**
   - Visit your deployed application
   - Create a new account or login
   - Create some test trips
   - Verify trips appear correctly

3. **Verify Security**
   - Login as a different user
   - Confirm you CANNOT see trips from the other user
   - Only your own trips should be visible

## Understanding the Security Model

### Before This Implementation
```
Browser/Client → Anon Key → Supabase
                   ↓
              All data accessible ❌
```

### After This Implementation
```
Browser/Client → API Routes → Service Role Key → Supabase
                                      ↓
                            Application filters by user_id ✅
                            
Browser/Client → Anon Key → Supabase (Direct Access)
                   ↓
              Blocked by RLS ✅
```

## Troubleshooting

### Error: "Missing SUPABASE_SERVICE_ROLE_KEY"
- Make sure you added the environment variable to Vercel
- Redeploy your application after adding the variable
- Check that the variable name is exactly: `SUPABASE_SERVICE_ROLE_KEY`

### Error: "Failed to create trip" or similar
- Check Vercel logs for detailed error messages
- Verify the service role key is correct
- Ensure RLS policies were created successfully

### Users can still see other users' trips
- Verify RLS is enabled on the `trips` table
- Confirm the restrictive policy was created
- Check your application code is filtering by `user_id`
- Clear your browser cache and try again

### "new row violates row-level security policy" error
This means RLS is working! If you see this for legitimate operations:
- Ensure you redeployed with the service role key environment variable
- The service role key should bypass RLS policies

## Security Best Practices

✅ **DO:**
- Keep your service role key secret (never expose to client-side code)
- Use environment variables for sensitive keys
- Enable RLS on all tables containing user data
- Test with multiple user accounts to verify isolation

❌ **DON'T:**
- Commit service role keys to version control
- Use service role key in client-side code
- Disable RLS in production
- Rely solely on application-level security without RLS

## Alternative: Migrate to Supabase Auth (Advanced)

For even better security, consider migrating from custom authentication to Supabase Auth:

**Benefits:**
- Built-in JWT token handling
- RLS policies can use `auth.uid()` directly
- Better session management
- Simplified code

This would require refactoring your authentication system but provides more robust security.

## Summary

After completing these steps:
1. ✅ Service role key added to Vercel environment variables
2. ✅ Application redeployed with new environment variable
3. ✅ RLS enabled on all tables in Supabase
4. ✅ Restrictive policies created to block direct access
5. ✅ Application tested with multiple users

Your application is now secure with proper RLS configuration!

---

**Need Help?**
- Check Vercel deployment logs for backend errors
- Check browser console for frontend errors
- Review Supabase logs in Dashboard → Logs
- Refer to [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
