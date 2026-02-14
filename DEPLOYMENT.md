# Deployment Guide

This guide will help you deploy the Travel Assistant application to Vercel or other hosting platforms.

## Prerequisites

Before deploying, ensure you have:

1. **GitHub Account** - Your code should be pushed to a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Supabase Project** - See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
4. **OpenAI API Key** - Get from [platform.openai.com](https://platform.openai.com)

## Deploying to Vercel

### Step 1: Push to GitHub

Ensure your code is in a GitHub repository:

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Project"
3. Select your GitHub repository
4. Vercel will automatically detect Next.js

### Step 3: Configure Environment Variables

**CRITICAL:** Add these environment variables in Vercel:

1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add the following variables:

#### Required Variables

| Variable Name | Description | Where to Get It |
|--------------|-------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (SECRET!) | Supabase Dashboard → Settings → API |
| `OPENAI_API_KEY` | Your OpenAI API key | OpenAI Dashboard → API Keys |

#### Important Notes

- ✅ Set all variables for **Production**, **Preview**, and **Development** environments
- ⚠️ **NEVER** commit these keys to your repository
- 🔒 `SUPABASE_SERVICE_ROLE_KEY` is a secret key - it bypasses all security rules
- 🔒 Keep your `OPENAI_API_KEY` private to avoid unauthorized usage

### Step 4: Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete (2-3 minutes)
3. Vercel will provide you with a URL (e.g., `your-app.vercel.app`)

### Step 5: Verify Deployment

1. Visit your deployed URL
2. Test user registration/login
3. Try creating a trip and generating a packing list
4. Check the Vercel logs if you encounter any errors

## Environment Variables Reference

### Supabase Configuration

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find these:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy the values from the "Project API keys" section

### OpenAI Configuration

```env
OPENAI_API_KEY=sk-proj-...
```

**Where to find this:**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Copy the key immediately (you won't see it again)

## Troubleshooting

### Build Failures

#### Error: "Missing SUPABASE_SERVICE_ROLE_KEY"
- **Cause:** Environment variable not set in Vercel
- **Solution:** Add the variable in Vercel dashboard under Environment Variables

#### Error: "Invalid supabaseUrl"
- **Cause:** Placeholder values still in environment variables
- **Solution:** Replace with actual values from Supabase dashboard

#### Error: "OpenAI API key is not configured"
- **Cause:** Missing or invalid OpenAI API key
- **Solution:** Add valid API key in Vercel environment variables

### Runtime Errors

#### 500 Error: "Missing Supabase environment variables"
- **Cause:** Environment variables not properly set
- **Solution:** Check Vercel dashboard and ensure all required variables are set

#### 401 Error: Authentication fails
- **Cause:** Incorrect Supabase keys
- **Solution:** Verify you copied the correct keys from Supabase dashboard

#### Packing list generation fails
- **Cause:** OpenAI API key issues (invalid, no credits, or rate limited)
- **Solution:** 
  - Verify API key is correct
  - Check OpenAI account has available credits
  - Wait if rate limited

### Deployment Best Practices

1. **Use Environment Variables:** Never hardcode API keys
2. **Test Locally First:** Run `npm run build` locally before deploying
3. **Check Logs:** Use Vercel's log viewer to debug issues
4. **Monitor Usage:** Keep an eye on OpenAI and Supabase usage
5. **Set Budget Limits:** Configure spending limits on OpenAI

## Alternative Deployment Options

### Netlify

1. Connect your GitHub repository
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variables in Netlify settings

### Railway

1. Connect repository
2. Add environment variables
3. Railway auto-detects Next.js configuration

### DigitalOcean App Platform

1. Create a new app
2. Connect GitHub repository
3. Select Node.js environment
4. Add environment variables
5. Deploy

### Self-Hosting

If you prefer to host on your own server:

```bash
# Build the application
npm run build

# Start the production server
npm start
```

Ensure environment variables are set on your server (e.g., in `.env.local` or system environment).

## Security Checklist

Before deploying to production:

- [ ] All API keys are set as environment variables (not in code)
- [ ] `.env.local` is in `.gitignore`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is marked as secret in hosting platform
- [ ] `OPENAI_API_KEY` is marked as secret in hosting platform
- [ ] Supabase Row Level Security (RLS) policies are enabled
- [ ] HTTPS is enforced (Vercel does this automatically)
- [ ] CORS headers are properly configured

## Monitoring and Maintenance

### Vercel Analytics

Enable Vercel Analytics to monitor:
- Page load times
- User traffic
- Error rates
- Core Web Vitals

### Supabase Dashboard

Monitor:
- Database usage
- API requests
- Authentication metrics
- Storage usage

### OpenAI Dashboard

Track:
- API usage
- Cost per day
- Request volume
- Error rates

## Updating Your Deployment

To deploy updates:

```bash
# Make your changes
git add .
git commit -m "Description of changes"
git push origin main
```

Vercel automatically redeploys when you push to your main branch.

## Getting Help

If you encounter issues:

1. Check the [Vercel Documentation](https://vercel.com/docs)
2. Review [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
3. Check Vercel deployment logs
4. Create an issue in the GitHub repository

## Cost Estimates

### Free Tier Limits

- **Vercel:** Unlimited deployments, 100 GB bandwidth/month
- **Supabase:** 500 MB database, 1 GB file storage, 2 GB bandwidth
- **OpenAI:** Pay-as-you-go, ~$0.002 per packing list generated

For a small application with moderate traffic, expect:
- Vercel: $0/month (free tier)
- Supabase: $0/month (free tier)
- OpenAI: $5-20/month depending on usage

## Next Steps

After successful deployment:

1. Test all features in production
2. Set up custom domain (optional)
3. Enable Vercel Analytics
4. Monitor error rates and performance
5. Set budget alerts for OpenAI usage

---

**Note:** This application does NOT require Python. If you see Python-related errors, ensure you're deploying the correct repository and that no Python dependencies were accidentally added.
