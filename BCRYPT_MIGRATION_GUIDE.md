# Bcrypt Password Migration Guide

## Overview

This project has been updated to migrate from base64 password encoding to bcrypt password hashing for improved security. The migration is designed to be seamless with zero downtime and no user disruption.

## What Has Been Implemented

### 1. Code Changes

#### ✅ Installed Dependencies
- `bcrypt` - Industry-standard password hashing library
- `@types/bcrypt` - TypeScript type definitions

#### ✅ Updated Files

**`src/lib/auth-utils.ts`**
- Kept client-safe validation functions only (`validatePassword`, `validateUsername`)
- Removed password hashing functions to prevent bcrypt from being bundled in client code

**`src/lib/auth-utils-server.ts`** (NEW FILE)
- Added `hashPasswordBcrypt()` - New bcrypt hashing function with 12 salt rounds
- Added `hashPasswordBase64()` - Legacy base64 function (backward compatibility only)
- Added `hashPassword()` - Now defaults to bcrypt for all new passwords
- Added `verifyPassword()` - Now accepts hash type parameter and handles both bcrypt and base64
- Server-only file that safely imports bcrypt without affecting client bundles

**`src/lib/supabase.ts`**
- Added `password_hash_type` field to database TypeScript types
- Type is `'base64' | 'bcrypt'` for type safety

**`src/app/api/auth/register/route.ts`**
- All new user registrations now use bcrypt hashing
- Sets `password_hash_type: 'bcrypt'` for new accounts

**`src/app/api/auth/login/route.ts`**
- Fetches `password_hash_type` from database
- Verifies password using the correct hash type
- **Implements opportunistic upgrade**: When a user with base64 hash logs in successfully, their password is automatically upgraded to bcrypt

### 2. How It Works

#### For New Users
1. User registers → Password is hashed with bcrypt (12 salt rounds)
2. User data stored with `password_hash_type: 'bcrypt'`
3. All future logins use bcrypt verification

#### For Existing Users
1. User logs in → System detects `password_hash_type: 'base64'` (or null/undefined)
2. Password verified using base64 method
3. **Upon successful login**: Password automatically re-hashed with bcrypt and updated in database
4. User's `password_hash_type` updated to `'bcrypt'`
5. Next login will use bcrypt verification
6. User experiences zero disruption - completely transparent

## What You Need To Do

### 🔴 CRITICAL: Database Migration Required

You must add the `password_hash_type` column to your Supabase `users` table before deploying this code.

#### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Tables** → **users**
3. Click **+ New Column**
4. Configure:
   - **Name**: `password_hash_type`
   - **Type**: `text` or `varchar`
   - **Default value**: `'base64'`
   - **Allow nullable**: No (or Yes with default value)
5. Click **Save**

#### Option 2: Using SQL Editor

Execute this SQL in your Supabase SQL Editor:

```sql
-- Add the password_hash_type column with default value for existing users
ALTER TABLE users 
ADD COLUMN password_hash_type VARCHAR(10) DEFAULT 'base64' NOT NULL;

-- Ensure all existing users have the base64 type set
UPDATE users 
SET password_hash_type = 'base64' 
WHERE password_hash_type IS NULL;
```

#### Option 3: Using Supabase CLI Migration

Create a new migration file:

```bash
supabase migration new add_password_hash_type
```

Add this SQL to the migration file:

```sql
-- Add password_hash_type column to users table
ALTER TABLE users 
ADD COLUMN password_hash_type VARCHAR(10) DEFAULT 'base64' NOT NULL;

-- Set existing users to base64
UPDATE users 
SET password_hash_type = 'base64' 
WHERE password_hash_type IS NULL;
```

Apply the migration:

```bash
supabase db push
```

### 🟡 Verification Steps

After adding the database column:

1. **Test New Registration**
   ```bash
   # Create a new user
   # Verify in database that password_hash_type = 'bcrypt'
   # Verify password is not base64 encoded
   ```

2. **Test Existing User Login** (if you have test users)
   ```bash
   # Log in with an existing user (base64 hash)
   # Should log in successfully
   # Check database - user should now have password_hash_type = 'bcrypt'
   # Try logging in again - should still work
   ```

3. **Monitor Logs**
   ```bash
   # Watch server logs for migration messages:
   # "Successfully upgraded password hash for user: <username>"
   ```

### 🟢 Deployment Checklist

- [ ] Database migration completed (password_hash_type column added)
- [ ] Verified column has default value 'base64'
- [ ] Dependencies installed (`npm install` if pulling code)
- [ ] Build passes (`npm run build`)
- [ ] Tests pass (if applicable)
- [ ] Deploy code to production
- [ ] Monitor error logs for first 24 hours
- [ ] Check migration progress (see monitoring section below)

## Monitoring Migration Progress

### Check Migration Status

Run this query in Supabase SQL Editor:

```sql
-- See how many users are using each hash type
SELECT 
  password_hash_type,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM users
GROUP BY password_hash_type
ORDER BY user_count DESC;
```

### Find Unmigrated Users

```sql
-- Find users still using base64
SELECT 
  id,
  username,
  created_at,
  password_hash_type
FROM users
WHERE password_hash_type = 'base64'
ORDER BY created_at DESC;
```

### Recent Migrations

```sql
-- This assumes you're tracking when passwords were updated
-- You might want to add an updated_at timestamp field
SELECT 
  username,
  password_hash_type,
  created_at
FROM users
WHERE password_hash_type = 'bcrypt'
ORDER BY created_at DESC
LIMIT 20;
```

## Timeline Expectations

- **Day 1-7**: Active users will be automatically migrated as they log in
- **Week 1-4**: Most users should be migrated (depends on login frequency)
- **Month 3-6**: Long-tail of inactive users will remain on base64

### Migration Targets

- **Week 1**: Expect 40-60% migration (frequent users)
- **Month 1**: Expect 70-80% migration
- **Month 3**: Expect 85-95% migration
- **Remaining**: Inactive/abandoned accounts

## Security Benefits

✅ **Before (Base64)**
- Not a hashing algorithm - easily reversible
- No salt - identical passwords = identical hashes
- Vulnerable to rainbow table attacks
- Instant brute force

✅ **After (Bcrypt)**
- Industry-standard cryptographic hash
- Built-in salting (unique per password)
- Computationally expensive (slows brute force attacks)
- Configurable work factor (12 rounds = ~300ms per hash)
- Resistant to rainbow tables

## Rollback Plan

If issues occur:

### Emergency Rollback (Code Only)

1. Revert to previous deployment
2. Database column remains (harmless)
3. System continues to work with base64 for all users

### Partial Rollback (Keep Migrated Users)

The migration is safe to stop at any time:
- Users already migrated to bcrypt will continue to work
- Users not yet migrated will continue with base64
- Database column tracks which type each user has

## Future Improvements (Optional)

### Phase 2: Force Migration for Dormant Accounts

After 6-12 months, for users still on base64:

1. Send email notification: "Security upgrade required"
2. Require password reset on next login
3. Password reset always creates bcrypt hash

### Phase 3: Cleanup (12+ months later)

Once all users migrated:
1. Remove `hashPasswordBase64()` function
2. Remove base64 support from `verifyPassword()`
3. Optionally remove `password_hash_type` column (or keep for audit trail)

## Troubleshooting

### "Column does not exist" error

**Problem**: Code deployed before database migration

**Solution**: Run the database migration SQL immediately

### Users can't log in after migration

**Problem**: Possible bcrypt installation issue

**Solution**: 
```bash
npm install bcrypt --save
# If on Alpine Linux or Docker:
npm rebuild bcrypt --build-from-source
```

### "Failed to upgrade password hash" in logs

**Problem**: Opportunistic upgrade failed (non-critical)

**Solution**: 
- User can still log in successfully
- Check Supabase permissions
- Verify database connection
- User will be retried on next login

## Support

If you encounter issues:

1. Check server logs for detailed error messages
2. Verify database column exists and is accessible
3. Test with a single user account first
4. Check that bcrypt is properly installed

## Summary

✅ **Zero downtime migration**
✅ **Backward compatible**  
✅ **Automatic and transparent to users**  
✅ **Immediate security improvement for new users**  
✅ **Gradual migration for existing users**  

The only action required from you is to add the `password_hash_type` column to your database before deploying.
