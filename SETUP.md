# Travel Assistant - Setup Guide

Complete setup instructions for the Travel Assistant application.

## Quick Links

- **Fast Setup (5 min)**: See [QUICK_START.md](./QUICK_START.md)
- **Main Documentation**: See [README.md](./README.md)
- **Features Documentation**: See [FEATURES.md](./FEATURES.md)

---

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (free) - [Sign up here](https://supabase.com)
- OpenAI API key (required for personalized lists)

---

## Setup Steps

### Step 1: Clone and Install

```bash
git clone <repository-url>
cd travel-assistant
npm install
```

### Step 2: Supabase Setup

#### 2.1 Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, Google, or email
4. Verify your email (if required)

#### 2.2 Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in the project details:
   - **Name**: Travel Assistant (or any name you prefer)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select the region closest to your users
4. Click "Create new project"
5. Wait for the project to be provisioned (1-2 minutes)

#### 2.3 Get Your API Keys

1. Once your project is ready, go to **Project Settings** (gear icon ⚙️)
2. Navigate to **API** section
3. You'll need two values:
   - **Project URL**: Found under "Project URL" (looks like `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public key**: Found under "Project API keys" → "anon public"
4. Keep these values handy for the next step

#### 2.4 Create the Users Table

1. In your Supabase dashboard, go to **Table Editor** (in the sidebar)
2. Click **"New Table"**
3. Configure the table:
   - **Name**: `users`
   - **Description**: User authentication table
   - Disable "Enable Row Level Security (RLS)" for now

4. Click **"Save"** to create the table with default columns (`id` and `created_at`)

5. Add additional columns by clicking **"Add Column"**:

   **Column 1: username**
   - Name: `username`
   - Type: `text`
   - ✅ Check "Is Unique"
   - ✅ Check "Is Nullable" = NO

   **Column 2: password**
   - Name: `password`
   - Type: `text`
   - ✅ Check "Is Nullable" = NO

Your `users` table should now have:
- `id` (uuid, primary key, auto-generated)
- `username` (text, unique, required)
- `password` (text, required)
- `created_at` (timestamptz, auto-generated)

#### 2.5 Guest Login Setup (Optional)

If you want to enable guest login feature:

1. In Supabase **SQL Editor**, click "New Query"
2. Copy and paste this migration script:

```sql
-- Make password column nullable (for guest users)
ALTER TABLE users 
ALTER COLUMN password DROP NOT NULL;

-- Add is_guest column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;

-- Update existing users
UPDATE users 
SET is_guest = false 
WHERE is_guest IS NULL;

-- Create guest_counter table
CREATE TABLE IF NOT EXISTS guest_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  counter INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert initial counter value
INSERT INTO guest_counter (id, counter) 
VALUES (1, 0) 
ON CONFLICT (id) DO NOTHING;

-- Create function to get next guest number
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

3. Click "Run" to execute the script

### Step 3: Environment Setup

#### 3.1 Create Environment File

In your project root directory, create `.env.local`:

```bash
cp .env.local.example .env.local
```

Or create it manually:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI Configuration (Required for AI-generated lists)
OPENAI_API_KEY=your_openai_api_key_here
```

#### 3.2 Add Your Credentials

1. Replace `NEXT_PUBLIC_SUPABASE_URL` with your Project URL from Step 2.3
2. Replace `NEXT_PUBLIC_SUPABASE_ANON_KEY` with your anon public key from Step 2.3
3. Replace `OPENAI_API_KEY` with your OpenAI API key (see Step 4)

### Step 4: OpenAI API Key

1. Go to [OpenAI API](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Generate a new API key
4. Copy the key and add it to your `.env.local` file

### Step 5: Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

**Important**: Restart the server after adding environment variables!

---

## Verification Checklist

Use this checklist to verify everything works:

### Pre-Setup (Should Already Be Complete)
- [x] Dependencies installed
- [x] Authentication components exist
- [x] API routes implemented

### Your Setup Tasks
- [ ] Supabase account created
- [ ] Supabase project created
- [ ] Users table created with all columns
- [ ] API keys copied
- [ ] `.env.local` file created with correct values
- [ ] Development server running

### Testing Authentication
- [ ] Modal appears when opening the app
- [ ] Can create new account with valid credentials
- [ ] Password validation works (8+ chars, uppercase, lowercase)
- [ ] Username uniqueness is enforced
- [ ] Can login with correct credentials
- [ ] Error shows for wrong credentials
- [ ] Can logout and modal reappears
- [ ] Login persists after page refresh

### Guest Login Testing (If Enabled)
- [ ] "Continue as Guest" button appears
- [ ] Can login as guest
- [ ] Guest username format is correct (guest_user1, guest_user2, etc.)
- [ ] "(Guest)" badge shows in header

---

## Troubleshooting

### "Missing Supabase environment variables"

**Problem**: Environment variables not found

**Solution**:
1. Verify `.env.local` exists in project root (not in `src/`)
2. Check variable names are exactly:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Stop server (Ctrl+C) and restart: `npm run dev`

### "Failed to create account"

**Problem**: Database connection issue

**Solution**:
1. Go to Supabase dashboard
2. Check project status is "Active" (green)
3. Verify `users` table exists
4. Check table has columns: `id`, `username`, `password`, `created_at`
5. Verify API keys are correct in `.env.local`

### Modal doesn't appear

**Problem**: UI rendering issue

**Solution**:
1. Open browser console (F12)
2. Look for error messages in red
3. Clear browser cache (Ctrl+Shift+Delete)
4. Hard refresh page (Ctrl+Shift+R)
5. Check terminal for server errors

### "Username already exists"

**Problem**: Username is taken

**Solution**:
- Try a different username, OR
- Go to Supabase → Table Editor → users table
- Find and delete the existing user row

### API Key Not Working

**Problem**: OpenAI API key issues

**Solution**:
- Ensure you've copied the entire API key correctly
- Check that the key starts with `sk-`
- Verify your OpenAI account has available credits
- Restart the development server after adding the key

---

## Security Configuration (Production)

### Enable Row Level Security (RLS)

For production use, enable RLS:

1. In **Table Editor**, click on the `users` table
2. Click **"Enable RLS"** at the top
3. Go to **Authentication** → **Policies**
4. Add policies:

```sql
-- Allow user registration
CREATE POLICY "Allow user registration"
ON users FOR INSERT
WITH CHECK (true);

-- Allow users to read own data
CREATE POLICY "Users can read own data"
ON users FOR SELECT
USING (true);
```

### Additional Security Measures

Before deploying to production:

- [ ] Upgrade to bcrypt password hashing
- [ ] Enable Row Level Security (RLS) in Supabase
- [ ] Add rate limiting to API routes
- [ ] Use HTTPS in production
- [ ] Implement proper session management
- [ ] Add audit logging
- [ ] Set up monitoring and alerts
- [ ] Review Supabase security settings
- [ ] Regular dependency updates
- [ ] Implement CORS policies

---

## Database Schema Reference

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NULL,                          -- Nullable for guests
  is_guest BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on username for faster lookups
CREATE INDEX idx_users_username ON users(username);
```

### Guest Counter Table (Optional)

```sql
CREATE TABLE guest_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  counter INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Next Steps

After completing the setup:

1. **Test the System**: Follow the verification checklist above
2. **Read Features Documentation**: See [FEATURES.md](./FEATURES.md)
3. **Review Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
4. **Check Testing Guide**: See [TESTING.md](./TESTING.md)

---

## Support

For issues and questions:

1. Check browser console (F12) for errors
2. Review Supabase dashboard logs
3. Verify all environment variables are set
4. Check this guide's troubleshooting section
5. Review the [README.md](./README.md)

---

## Quick Reference

### Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run tests
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
OPENAI_API_KEY=sk-...
```

### Important URLs

- Supabase Dashboard: https://app.supabase.com
- OpenAI API Keys: https://platform.openai.com/api-keys
- Local Development: http://localhost:3000

---

**Setup complete! You're ready to start building with Travel Assistant! 🚀**
