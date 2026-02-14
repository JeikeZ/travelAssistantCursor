# Vercel Deployment Checklist

Use this checklist to ensure your deployment is properly configured.

## Pre-Deployment Checklist

### 1. GitHub Repository

- [ ] Code is pushed to GitHub
- [ ] Repository is `JeikeZ/travelAssistantCursor` (or your fork)
- [ ] Latest changes are on the main branch (or your deployment branch)

### 2. Supabase Setup

- [ ] Supabase project created at [supabase.com](https://supabase.com)
- [ ] Database tables created (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md))
- [ ] You have copied the following from Supabase Dashboard → Settings → API:
  - [ ] Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
  - [ ] Anon/Public Key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
  - [ ] Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`) - **Keep secret!**

### 3. OpenAI Setup

- [ ] OpenAI account created at [platform.openai.com](https://platform.openai.com)
- [ ] API key created at [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- [ ] OpenAI account has available credits
- [ ] You have copied your API key (`OPENAI_API_KEY`)

## Vercel Setup Checklist

### 1. Create Vercel Project

- [ ] Go to [vercel.com/new](https://vercel.com/new)
- [ ] Click "Import Project"
- [ ] Select your GitHub repository
- [ ] Confirm framework is detected as "Next.js"

### 2. Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

#### Add All 4 Required Variables:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - Value: `https://your-project.supabase.co`
  - Environments: ✅ Production, ✅ Preview, ✅ Development

- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Environments: ✅ Production, ✅ Preview, ✅ Development

- [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Environments: ✅ Production, ✅ Preview, ✅ Development
  - **Important:** Mark as "Sensitive" if option available

- [ ] `OPENAI_API_KEY`
  - Value: `sk-proj-...` or `sk-...`
  - Environments: ✅ Production, ✅ Preview, ✅ Development
  - **Important:** Mark as "Sensitive" if option available

### 3. Verify Environment Variables

Double-check your environment variables:

- [ ] No typos in variable names (case-sensitive!)
- [ ] No extra spaces before/after values
- [ ] All values are actual credentials, not placeholders like "your-key-here"
- [ ] Supabase URL starts with `https://`
- [ ] OpenAI API key starts with `sk-`

### 4. Deploy

- [ ] Click "Deploy" button in Vercel
- [ ] Wait for build to complete (2-5 minutes)
- [ ] Check deployment logs for errors

## Post-Deployment Checklist

### 1. Verify Deployment

- [ ] Deployment shows "Ready" status in Vercel
- [ ] No errors in deployment logs
- [ ] Visit your deployment URL (e.g., `your-app.vercel.app`)
- [ ] Page loads without errors

### 2. Test Authentication

- [ ] Click to create an account
- [ ] Username field appears and works
- [ ] Password field appears and works
- [ ] Registration completes successfully
- [ ] You can log out
- [ ] You can log back in with same credentials

### 3. Test Core Features

- [ ] Enter destination city (autocomplete works)
- [ ] Select trip duration
- [ ] Select trip type
- [ ] Click "Generate Packing List"
- [ ] Packing list appears (may take 5-10 seconds)
- [ ] Items can be checked off
- [ ] Progress bar updates
- [ ] Can add custom items

### 4. Check Browser Console

Open browser DevTools (F12) and check Console:

- [ ] No error messages
- [ ] No warnings about missing environment variables
- [ ] No Supabase connection errors
- [ ] No OpenAI API errors

## Troubleshooting Checklist

If deployment fails, check:

### Build Errors

- [ ] Check Vercel deployment logs
- [ ] Look for specific error messages
- [ ] Verify all dependencies are in `package.json`
- [ ] Try building locally: `npm run build`

### Runtime Errors

#### "Missing Supabase environment variables"

- [ ] Verify all 3 Supabase variables are set in Vercel
- [ ] Check for typos in variable names
- [ ] Ensure variables are set for all environments
- [ ] Redeploy after adding variables

#### "OpenAI API key is not configured"

- [ ] Verify `OPENAI_API_KEY` is set in Vercel
- [ ] Check API key is valid (test in OpenAI playground)
- [ ] Ensure you have credits in OpenAI account
- [ ] Redeploy after adding variable

#### Authentication doesn't work

- [ ] Check Supabase database tables exist
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- [ ] Check Supabase dashboard for API errors
- [ ] Ensure Row Level Security policies are configured

#### Packing list generation fails

- [ ] Verify OpenAI API key is correct
- [ ] Check OpenAI account has credits
- [ ] Look for rate limit errors in logs
- [ ] Try generating again (may be temporary)

## Common Mistakes

❌ **Don't:**
- Use placeholder values like "your-key-here"
- Commit API keys to GitHub
- Forget to set variables for all environments
- Copy keys with extra spaces or newlines

✅ **Do:**
- Use actual credentials from service dashboards
- Keep API keys secret and secure
- Set all 4 required environment variables
- Test locally before deploying

## Security Checklist

- [ ] `.env.local` is in `.gitignore` (should already be)
- [ ] No API keys are committed to GitHub
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is marked as sensitive in Vercel
- [ ] `OPENAI_API_KEY` is marked as sensitive in Vercel
- [ ] HTTPS is enabled (Vercel does this automatically)
- [ ] Security headers are configured (already in `vercel.json`)

## Performance Checklist

- [ ] Enable Vercel Analytics (optional but recommended)
- [ ] Set up monitoring for errors
- [ ] Monitor OpenAI usage and costs
- [ ] Monitor Supabase database usage
- [ ] Consider setting budget alerts

## What NOT to Worry About

### Python Errors

This project does NOT use Python. If you see Python-related errors:

- [ ] Check you're deploying the correct repository
- [ ] Verify Vercel project is linked to correct GitHub repo
- [ ] Clear browser cache
- [ ] Check deployment logs for actual error (not cached message)

The following are NOT needed:
- ❌ Python installation
- ❌ `requirements.txt`
- ❌ Virtual environment (venv)
- ❌ `setup.sh` or `verify-setup.sh` scripts

## Success Criteria

Your deployment is successful when:

✅ Vercel shows "Ready" status
✅ Website loads at your Vercel URL
✅ Users can register and login
✅ Trips can be created
✅ Packing lists can be generated
✅ All features work as expected
✅ No errors in browser console
✅ No errors in Vercel logs

## Next Steps After Successful Deployment

1. [ ] Set up custom domain (optional)
2. [ ] Enable Vercel Analytics
3. [ ] Set up error monitoring
4. [ ] Configure OpenAI usage alerts
5. [ ] Share your app with users!

## Getting Help

If you're still having issues:

1. **Check Documentation**
   - [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
   - [DEPLOYMENT_FIX_SUMMARY.md](./DEPLOYMENT_FIX_SUMMARY.md) - Recent fixes
   - [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Database setup

2. **Check Service Status**
   - [Vercel Status](https://www.vercel-status.com/)
   - [Supabase Status](https://status.supabase.com/)
   - [OpenAI Status](https://status.openai.com/)

3. **Review Logs**
   - Vercel deployment logs
   - Vercel function logs
   - Browser console errors
   - Supabase logs

4. **Common Solutions**
   - Redeploy after adding environment variables
   - Clear browser cache
   - Try in incognito/private mode
   - Check API credentials are correct

---

**Remember:** The most common deployment issues are:
1. Missing or incorrect environment variables
2. Using placeholder values instead of actual credentials
3. Typos in environment variable names

Double-check these first! ✅
