# Quick Start Guide - User Authentication

Get your user authentication system up and running in 5 minutes!

## Prerequisites

- ✅ Supabase account (free) - [Sign up here](https://supabase.com)
- ✅ Node.js installed
- ✅ Project dependencies installed (`npm install` - already done)

## 5-Minute Setup

### Step 1: Create Supabase Project (2 minutes)

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in:
   - Name: `Travel Assistant`
   - Database Password: *Choose a strong password*
   - Region: *Select closest to you*
4. Click **"Create new project"**
5. Wait for provisioning to complete

### Step 2: Create Users Table (1 minute)

In your Supabase dashboard:

1. Go to **Table Editor** (left sidebar)
2. Click **"New Table"**
3. Name: `users`
4. Disable RLS for now
5. Click **"Save"**
6. Add columns by clicking **"Add Column"**:

   **username**
   - Type: `text`
   - ✅ Is Unique
   - ✅ Is Nullable = NO

   **password**
   - Type: `text`
   - ✅ Is Nullable = NO

7. Click **"Save"** after each column

### Step 3: Get API Keys (1 minute)

1. Go to **Project Settings** (gear icon)
2. Click **API** in the menu
3. Copy these two values:
   - **Project URL**
   - **anon public key** (under "Project API keys")

### Step 4: Configure Environment Variables (1 minute)

1. Create a file named `.env.local` in your project root:

```bash
# In the project root directory
touch .env.local
```

2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Replace with your actual values from Step 3.

### Step 5: Run the Application (30 seconds)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## First Login Test

### Create Your First Account

1. The authentication modal appears automatically
2. Click **"Create an account"** at the bottom
3. Enter:
   - Username: `myusername`
   - Password: `MyPassword123`
4. Click **"Create Account"**
5. ✅ You should be logged in!

### Test Login

1. Click **"Logout"** in the top bar
2. Enter your credentials
3. Click **"Login"**
4. ✅ You should be logged back in!

## Verification

Your setup is complete when you see:

- ✅ Authentication modal appears on first visit
- ✅ Can create a new account
- ✅ Can login with created account
- ✅ Welcome message shows your username
- ✅ Can logout and login again

## Troubleshooting

### "Missing Supabase environment variables"
- **Solution**: Make sure `.env.local` is in the project root
- Restart dev server: Stop (Ctrl+C) and run `npm run dev` again

### "Failed to create account"
- **Solution**: Check that the `users` table exists in Supabase
- Verify columns: `id`, `username`, `password`, `created_at`

### "Username already exists"
- **Solution**: This is normal! Try a different username
- Or delete the user from Supabase Table Editor

### Modal doesn't appear
- **Solution**: Check browser console (F12) for errors
- Clear browser cache and reload

## What's Next?

Now that authentication works:

1. **Read**: `USER_AUTHENTICATION_GUIDE.md` for detailed features
2. **Secure**: Follow production security notes in `SUPABASE_SETUP.md`
3. **Extend**: Add trip storage linked to user accounts
4. **Enhance**: Implement password reset, profile editing, etc.

## Visual Confirmation

You should see:

```
┌─────────────────────────────────────┐
│  Welcome to the Travel Assistant    │
│  Please create an account with a    │
│  unique username and password...    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Username              [X]   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Password              [X]   │   │
│  └─────────────────────────────┘   │
│                                     │
│     [ Login ]                       │
│                                     │
│     Create an account               │
└─────────────────────────────────────┘
```

After login:

```
┌─────────────────────────────────────┐
│ Welcome back, myusername!  [Logout] │
└─────────────────────────────────────┘
```

## Need Help?

- **Detailed Setup**: See `SUPABASE_SETUP.md`
- **Feature Guide**: See `USER_AUTHENTICATION_GUIDE.md`
- **Overview**: See `IMPLEMENTATION_SUMMARY.md`

## Time Estimate

- ⏱️ **Setup**: ~5 minutes
- ⏱️ **Testing**: ~2 minutes
- ⏱️ **Total**: ~7 minutes

## Success Criteria

✅ Supabase project created  
✅ Users table exists  
✅ Environment variables configured  
✅ Application runs without errors  
✅ Can create new account  
✅ Can login and logout  
✅ Error messages work correctly  

**Congratulations!** Your user authentication system is now live! 🎉
