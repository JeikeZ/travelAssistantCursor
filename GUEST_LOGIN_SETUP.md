# Guest Login Feature - Setup Instructions

This guide will walk you through setting up the guest login feature in your Supabase database.

## 🎯 Overview

The guest login feature has been implemented in the code. Now you need to update your Supabase database to support it. This involves:
1. Making the `password` column nullable
2. Adding an `is_guest` column
3. Creating a `guest_counter` table
4. Creating a database function for guest numbering

---

## ⚙️ Database Setup Steps

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard at [https://app.supabase.com](https://app.supabase.com)
2. Select your Travel Assistant project
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New Query"** to create a new SQL query

---

### Step 2: Run the Database Migration Script

Copy and paste the following SQL script into the SQL Editor, then click **"Run"**:

```sql
-- ============================================
-- Guest Login Feature Database Migration
-- ============================================

-- 1. Make password column nullable (for guest users)
ALTER TABLE users 
ALTER COLUMN password DROP NOT NULL;

-- 2. Add is_guest column to identify guest users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;

-- 3. Update existing users to mark them as non-guests
UPDATE users 
SET is_guest = false 
WHERE is_guest IS NULL;

-- 4. Create guest_counter table to track guest user numbers
CREATE TABLE IF NOT EXISTS guest_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  counter INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Insert initial counter value
INSERT INTO guest_counter (id, counter) 
VALUES (1, 0) 
ON CONFLICT (id) DO NOTHING;

-- 6. Create function to get next guest number (atomic operation)
CREATE OR REPLACE FUNCTION get_next_guest_number()
RETURNS INTEGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  -- Update counter and get the new value in one atomic operation
  UPDATE guest_counter 
  SET counter = counter + 1,
      updated_at = now()
  WHERE id = 1 
  RETURNING counter INTO next_num;
  
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- 7. Create index on username for guest users (for faster lookups)
CREATE INDEX IF NOT EXISTS idx_users_guest_username 
ON users(username) WHERE is_guest = true;

-- 8. Verify the setup
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM guest_counter WHERE id = 1) 
    THEN '✅ Guest counter table created successfully'
    ELSE '❌ Guest counter table not found'
  END as counter_check,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'is_guest'
    )
    THEN '✅ is_guest column added successfully'
    ELSE '❌ is_guest column not found'
  END as column_check,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.routines 
      WHERE routine_name = 'get_next_guest_number'
    )
    THEN '✅ get_next_guest_number function created successfully'
    ELSE '❌ get_next_guest_number function not found'
  END as function_check;
```

---

### Step 3: Verify the Migration

After running the script, you should see a success message showing three checkmarks (✅):
- ✅ Guest counter table created successfully
- ✅ is_guest column added successfully
- ✅ get_next_guest_number function created successfully

If you see any ❌ marks, review the error messages and try running the specific failed section again.

---

### Step 4: Test the Database Setup

Run this test query to verify everything is working:

```sql
-- Test: Get next guest number
SELECT get_next_guest_number() as first_guest_number;
SELECT get_next_guest_number() as second_guest_number;
SELECT get_next_guest_number() as third_guest_number;

-- You should see:
-- first_guest_number: 1
-- second_guest_number: 2
-- third_guest_number: 3
```

Then check the counter:

```sql
-- Check current counter value
SELECT * FROM guest_counter;

-- You should see:
-- id: 1, counter: 3, updated_at: [current timestamp]
```

---

## ✅ Verification Checklist

After completing the setup, verify these items:

- [ ] The `users` table `password` column is now nullable
- [ ] The `users` table has an `is_guest` column (boolean)
- [ ] The `guest_counter` table exists with initial counter = 0
- [ ] The `get_next_guest_number()` function exists
- [ ] Test queries return sequential numbers (1, 2, 3, etc.)

---

## 🧪 Testing the Feature

### 1. Restart Your Development Server

After updating the database, restart your Next.js development server:

```bash
# Stop the server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

### 2. Test Guest Login

1. Open your app at [http://localhost:3000](http://localhost:3000)
2. The authentication modal should appear
3. Look for the **"Continue as Guest"** button at the bottom
4. Click it

**Expected Result:**
- Modal closes
- You're logged in as `guest_user1`
- You can see "(Guest)" next to your username in the header
- You can use all app features normally

### 3. Test Multiple Guest Users

To test that guest numbering works correctly:

1. Logout from the app
2. Clear localStorage (in browser DevTools: Application → Local Storage → Clear)
3. Refresh the page
4. Click "Continue as Guest" again

**Expected Result:**
- You should be logged in as `guest_user2` (incremented)

### 4. Verify in Database

Check that guest users are being created correctly:

```sql
-- View all guest users
SELECT id, username, is_guest, password, created_at 
FROM users 
WHERE is_guest = true 
ORDER BY created_at DESC;
```

**Expected Result:**
- Each guest user has username format: `guest_user1`, `guest_user2`, etc.
- `is_guest` column is `true`
- `password` column is `null`
- `created_at` timestamp is recorded

---

## 🔍 Database Schema Reference

After migration, your `users` table schema should look like this:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NULL,                          -- ✅ Now nullable
  password_hash_type TEXT NULL,
  is_guest BOOLEAN DEFAULT false,              -- ✅ New column
  created_at TIMESTAMPTZ DEFAULT now()
);
```

And the new `guest_counter` table:

```sql
CREATE TABLE guest_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  counter INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🐛 Troubleshooting

### Issue: "password column cannot be null" error

**Problem:** The migration didn't run properly or was rolled back.

**Solution:**
```sql
-- Run this command to make password nullable
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
```

### Issue: "is_guest column doesn't exist" error

**Problem:** Column wasn't added.

**Solution:**
```sql
-- Add the is_guest column
ALTER TABLE users ADD COLUMN is_guest BOOLEAN DEFAULT false;
```

### Issue: "function get_next_guest_number does not exist"

**Problem:** The function wasn't created.

**Solution:**
```sql
-- Create the function
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

### Issue: Guest users have duplicate usernames

**Problem:** Race condition or counter table not initialized.

**Solution:**
```sql
-- Check counter value
SELECT * FROM guest_counter;

-- If empty, initialize it
INSERT INTO guest_counter (id, counter) VALUES (1, 0);

-- Find highest guest number
SELECT MAX(CAST(SUBSTRING(username FROM 'guest_user(\d+)') AS INTEGER)) 
FROM users 
WHERE is_guest = true;

-- Update counter to match
UPDATE guest_counter SET counter = [highest_number_from_above];
```

### Issue: API returns "Failed to create guest account"

**Possible Causes:**
1. Database migration not run
2. Supabase connection issue
3. Function doesn't exist

**Solution:**
1. Check Supabase project is active (green status)
2. Verify environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-url-here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
   ```
3. Check browser console for detailed error
4. Check Supabase logs: Dashboard → Logs → API Logs

---

## 📊 Database Queries for Monitoring

### View all guest users
```sql
SELECT 
  username, 
  is_guest, 
  created_at,
  CASE WHEN password IS NULL THEN 'No password' ELSE 'Has password' END as password_status
FROM users 
WHERE is_guest = true 
ORDER BY created_at DESC;
```

### Count guest vs regular users
```sql
SELECT 
  is_guest,
  COUNT(*) as user_count
FROM users
GROUP BY is_guest;
```

### View current guest counter
```sql
SELECT 
  counter as next_guest_number,
  updated_at as last_updated
FROM guest_counter;
```

### View recent guest registrations
```sql
SELECT 
  username,
  created_at,
  created_at::date = CURRENT_DATE as created_today
FROM users
WHERE is_guest = true
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎉 Success!

Once you've completed these steps, your guest login feature is fully operational!

**What users can do:**
- ✅ Click "Continue as Guest" to instantly access the app
- ✅ Create trips and packing lists
- ✅ Use all features without registration
- ✅ Each guest gets unique username (guest_user1, guest_user2, etc.)

**Technical details:**
- ✅ Guest usernames are sequential and never duplicate
- ✅ Guest users have no password (null)
- ✅ Guest users are marked with `is_guest: true`
- ✅ All guest actions are tracked with timestamps

---

## 📚 Related Documentation

- **Main Setup Guide**: [QUICK_START.md](./QUICK_START.md)
- **Supabase Setup**: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **Authentication Guide**: [USER_AUTHENTICATION_GUIDE.md](./USER_AUTHENTICATION_GUIDE.md)

---

## 🆘 Need Help?

1. **Check browser console** (F12) for JavaScript errors
2. **Check Supabase logs** in your dashboard
3. **Verify environment variables** are set correctly
4. **Ensure database migration** completed successfully
5. **Test database functions** using the queries above

If you continue to have issues, review the error messages and check that all SQL commands executed without errors.
