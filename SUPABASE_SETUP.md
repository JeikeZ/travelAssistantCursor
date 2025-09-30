# Supabase Setup Instructions

This guide will walk you through setting up Supabase for user authentication in the Travel Assistant application.

## Prerequisites

- A Supabase account (sign up at [https://supabase.com](https://supabase.com))
- Node.js and npm installed

## Step 1: Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in the project details:
   - **Name**: Travel Assistant (or any name you prefer)
   - **Database Password**: Choose a strong password (save this - you'll need it later)
   - **Region**: Select the region closest to your users
4. Click "Create new project"
5. Wait for the project to be provisioned (this may take a few minutes)

## Step 2: Get Your API Keys

1. Once your project is ready, go to **Project Settings** (gear icon in the sidebar)
2. Navigate to **API** section
3. You'll need two values:
   - **Project URL**: Found under "Project URL" (looks like `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public key**: Found under "Project API keys" → "anon public"

## Step 3: Configure Environment Variables

1. In your project root directory, create a file named `.env.local`
2. Copy the contents from `.env.local.example`
3. Replace the placeholder values with your actual Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

## Step 4: Create the Users Table

1. In your Supabase dashboard, go to **Table Editor** (in the sidebar)
2. Click **"New Table"**
3. Configure the table as follows:
   - **Name**: `users`
   - **Description**: User authentication table
   - Disable "Enable Row Level Security (RLS)" for now (we'll configure this later)

4. Click **"Save"** to create the table with default columns (`id` and `created_at`)

5. Now add additional columns by clicking **"Add Column"** for each:

   **Column 1: username**
   - Name: `username`
   - Type: `text`
   - Default Value: (leave empty)
   - ✅ Check "Is Unique"
   - ✅ Check "Is Nullable" = NO (required field)
   - Click "Save"

   **Column 2: password**
   - Name: `password`
   - Type: `text`
   - Default Value: (leave empty)
   - ✅ Check "Is Nullable" = NO (required field)
   - Click "Save"

## Step 5: Verify Table Structure

Your `users` table should now have the following columns:
- `id` (uuid, primary key, auto-generated)
- `username` (text, unique, required)
- `password` (text, required)
- `created_at` (timestamptz, auto-generated)

## Step 6: Configure Row Level Security (Optional but Recommended)

For production use, you should enable Row Level Security:

1. In the **Table Editor**, click on the `users` table
2. Click **"Enable RLS"** at the top
3. Go to **Authentication** → **Policies**
4. Add the following policies:

   **Policy 1: Allow user registration (INSERT)**
   ```sql
   CREATE POLICY "Allow user registration"
   ON users FOR INSERT
   WITH CHECK (true);
   ```

   **Policy 2: Allow users to read their own data (SELECT)**
   ```sql
   CREATE POLICY "Users can read own data"
   ON users FOR SELECT
   USING (true);
   ```

## Step 7: Test the Connection

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:3000`
3. The authentication modal should appear automatically
4. Try creating a new account:
   - Enter a unique username (at least 3 characters)
   - Enter a password (at least 8 characters, with one uppercase and one lowercase letter)
   - Click "Create Account"

5. If successful, you should be logged in and see the main application

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Make sure your `.env.local` file is in the root directory
- Verify that the variable names match exactly: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart your development server after adding the environment variables

### Error: "Failed to create account"
- Check that the `users` table exists in your Supabase database
- Verify all columns are created correctly with the right types
- Check the browser console for detailed error messages

### Error: "Username already exists"
- This means the username is already taken in the database
- Try a different username

### Connection Issues
- Verify your Supabase project is active (green status in dashboard)
- Check that your API keys are correct
- Ensure you're using the `anon` public key, not the `service_role` key

## Security Notes

⚠️ **Important Security Considerations:**

1. **Password Hashing**: The current implementation uses basic base64 encoding for demonstration. For production, you should:
   - Implement proper password hashing using bcrypt on the server side
   - Never store passwords in plain text
   - Consider using Supabase Auth instead of custom authentication

2. **Row Level Security**: Enable RLS policies in production to ensure users can only access their own data

3. **Environment Variables**: Never commit `.env.local` to version control. The `.gitignore` file should already exclude it.

## Next Steps

Now that authentication is set up, you can:
- Store user-specific trip data in Supabase
- Create a trips table linked to users
- Implement password reset functionality
- Add email verification (optional)
- Migrate to Supabase Auth for more robust authentication

## Database Schema

Current table structure:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on username for faster lookups
CREATE INDEX idx_users_username ON users(username);
```

## Support

For more information:
- Supabase Documentation: [https://supabase.com/docs](https://supabase.com/docs)
- Supabase Discord: [https://discord.supabase.com](https://discord.supabase.com)
