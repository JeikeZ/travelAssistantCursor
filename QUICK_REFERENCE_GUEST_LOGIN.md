# Guest Login - Quick Reference Guide

## 🚀 Quick Start (3 Steps)

### 1. Run This SQL in Supabase
```sql
-- Copy/paste this entire block into Supabase SQL Editor

ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS guest_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  counter INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO guest_counter (id, counter) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;

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

### 2. Restart Dev Server
```bash
npm run dev
```

### 3. Test It
1. Open http://localhost:3000
2. Click "Continue as Guest"
3. You're in as `guest_user1`!

---

## 📋 What You'll See

### In The UI
- "Continue as Guest" button below login form
- Helper text: "No account needed. Your data will be stored locally."
- After login: "Welcome, guest_user1 (Guest)!"

### In The Database
```sql
-- Check guest users
SELECT username, is_guest, password, created_at 
FROM users 
WHERE is_guest = true;
```

Expected:
- `username`: guest_user1, guest_user2, etc.
- `is_guest`: true
- `password`: null
- `created_at`: timestamp

---

## ✅ Verification Checklist

Run this SQL to verify setup:
```sql
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM guest_counter) 
    THEN '✅ Counter exists' 
    ELSE '❌ Counter missing' 
  END as counter,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_guest'
  )
    THEN '✅ Column exists' 
    ELSE '❌ Column missing' 
  END as column,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'get_next_guest_number'
  )
    THEN '✅ Function exists' 
    ELSE '❌ Function missing' 
  END as function;
```

You should see three ✅ checkmarks.

---

## 🐛 Quick Fixes

### Error: "Function does not exist"
```sql
CREATE OR REPLACE FUNCTION get_next_guest_number()
RETURNS INTEGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  UPDATE guest_counter SET counter = counter + 1 WHERE id = 1 RETURNING counter INTO next_num;
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;
```

### Error: "Password cannot be null"
```sql
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
```

### Error: "Column is_guest does not exist"
```sql
ALTER TABLE users ADD COLUMN is_guest BOOLEAN DEFAULT false;
```

---

## 📖 Full Documentation

- **Complete Setup**: [GUEST_LOGIN_SETUP.md](./GUEST_LOGIN_SETUP.md)
- **Implementation Details**: [GUEST_LOGIN_IMPLEMENTATION_SUMMARY.md](./GUEST_LOGIN_IMPLEMENTATION_SUMMARY.md)

---

## 🎯 That's It!

Three steps, ~5 minutes, and you're done!
