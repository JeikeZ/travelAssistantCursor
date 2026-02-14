# Travel Assistant - Smart Packing Lists

A modern web application that generates personalized packing lists for travelers using AI-powered recommendations based on destination, trip duration, and trip type.

## Features

### User Authentication 🆕
- **User Profiles**: Secure user registration and login system
- **Individual Trip Storage**: Each user stores their own trip information
- **Password Security**: Strong password requirements (8+ chars, uppercase, lowercase)
- **Unique Usernames**: Database-enforced unique username validation
- **Persistent Sessions**: Stay logged in across browser sessions
- **Beautiful UI**: Modern authentication modal with smooth UX

### Core Functionality
- **Trip Setup**: Input destination, duration, and trip type
- **AI-Powered Lists**: Generate intelligent packing suggestions using OpenAI
- **Customizable Lists**: Add, edit, and remove items from your packing list
- **Progress Tracking**: Visual progress bar showing packing completion
- **Essential Items**: Highlighted critical items (passport, medication, etc.)
- **Category Organization**: Items grouped by clothing, toiletries, electronics, etc.
- **Weather Integration**: Optional weather forecasts for your destination

### User Experience
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Interactive Checklist**: Check off items as you pack them
- **Location-Specific**: Recommendations based on destination climate and customs
- **Duration-Aware**: Tailored suggestions for trip length
- **Mobile-Friendly**: Works seamlessly on all devices
- **Offline Fallback**: Basic packing lists when AI service is unavailable

## Tech Stack

- **Frontend**: Next.js 15 with App Router, TypeScript
- **Styling**: Tailwind CSS 4
- **AI Integration**: OpenAI GPT-3.5-turbo
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom user auth with Supabase
- **Icons**: Lucide React
- **State Management**: React Hooks with Local Storage
- **Hosting**: Vercel (recommended)

## Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key (required for personalized lists)
- Supabase account (free) - [Sign up here](https://supabase.com)

## Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd travel-assistant
npm install
```

### 2. Environment Setup

The application includes environment configuration files:

```bash
# Copy the example file to create your local environment
cp .env.local.example .env.local
```

Update `.env.local` with your API keys:

```env
# Supabase Configuration (Required for user authentication)
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI Configuration (Required for AI-generated lists)
OPENAI_API_KEY=your_openai_api_key_here
```

**🚀 Quick Setup for Authentication:**
See **[QUICK_START.md](./QUICK_START.md)** for a 5-minute setup guide!

### 3. Setup Supabase Authentication

Follow the detailed guide in **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**:

1. Create a Supabase project
2. Create the `users` table
3. Copy your API credentials to `.env.local`

### 4. Get Your OpenAI API Key

1. Go to [OpenAI API](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Generate a new API key
4. Copy the key and add it to your `.env.local` file
5. **Important**: Replace `your_openai_api_key_here` with your actual API key

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 6. Restart After Configuration

After adding your API keys to `.env.local`, restart the development server:

```bash
# Stop the server (Ctrl+C) and restart
npm run dev
```

## Authentication System

The app now includes a complete user authentication system:

### First Time Users
1. Open the app - authentication modal appears automatically
2. Click "Create an account"
3. Choose a unique username (3+ characters)
4. Create a strong password (8+ chars, 1 uppercase, 1 lowercase)
5. Start planning your trips!

### Returning Users
1. Enter your username and password
2. Click "Login"
3. Welcome back message appears with your username

### Features
- ✅ Secure user registration and login
- ✅ Password validation and hashing
- ✅ Unique username checking
- ✅ Error handling for incorrect credentials
- ✅ Persistent sessions across browser refreshes
- ✅ Beautiful modal UI matching modern design standards

**See [USER_AUTHENTICATION_GUIDE.md](./USER_AUTHENTICATION_GUIDE.md) for complete documentation.**

## How It Works

### Without API Key
- The app will show a warning message: "OpenAI API Key Required"
- A basic fallback packing list with essential items will be provided
- You can still use all the packing list features (add items, check off, etc.)

### With API Key
- AI generates personalized packing lists based on your destination and trip details
- Recommendations consider local climate, customs, and trip type
- Lists are cached for better performance

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                # Authentication endpoints 🆕
│   │   │   ├── login/          # User login
│   │   │   └── register/       # User registration
│   │   ├── generate-packing-list/# OpenAI integration
│   │   ├── cities/               # City search API
│   │   └── weather/              # Weather API
│   ├── completion/               # Trip completion page
│   ├── packing-list/            # Main packing list page
│   ├── simple/                  # Simple interface
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page (trip setup)
├── components/
│   ├── auth/                    # Authentication components 🆕
│   │   └── AuthModal.tsx       # Login/Register modal
│   ├── ErrorBoundary.tsx        # Error boundary component
│   └── ui/                      # Reusable UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Checkbox.tsx
│       ├── CitySearchInput.tsx
│       ├── Input.tsx
│       ├── ProgressBar.tsx
│       ├── Select.tsx
│       ├── Toast.tsx
│       └── WeatherForecast.tsx
├── hooks/                       # Custom React hooks
│   ├── useAsyncState.ts
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   └── usePackingList.ts
├── lib/
│   ├── auth-utils.ts           # Auth validation utilities 🆕
│   ├── supabase.ts             # Supabase client config 🆕
│   ├── openai.ts               # OpenAI integration
│   └── utils.ts                # Utility functions
└── types/
    └── index.ts                # TypeScript type definitions
```

## Usage

### 1. Plan Your Trip
- Enter your destination (country and city)
- Specify trip duration in days
- Select your trip type (business, leisure, beach, hiking, etc.)

### 2. Review Your Packing List
- AI generates a personalized list based on your trip details
- Essential items are highlighted with stars
- Items are organized by category
- Weather forecast is shown (if available)

### 3. Customize Your List
- Add custom items with the "Add Custom Item" button
- Edit or delete custom items
- Mark items as essential if needed

### 4. Pack and Track Progress
- Check off items as you pack them
- Watch your progress bar fill up
- Essential items are prominently displayed

### 5. Complete Your Packing
- Once 100% packed, proceed to completion
- Get a congratulations message

## Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking

# Testing
npm test             # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:e2e     # Run end-to-end tests
npm run test:e2e:ui  # Run E2E tests with UI
npm run test:all     # Run all tests

# Analysis
npm run analyze      # Analyze bundle size
```

## Troubleshooting

### "Using Basic Packing List" Warning
This appears when:
- OpenAI API key is not configured
- API key is invalid
- OpenAI service is temporarily unavailable

**Solution**: Add your OpenAI API key to `.env.local` and restart the server.

### API Key Not Working
- Ensure you've copied the entire API key correctly
- Check that the key starts with `sk-`
- Verify your OpenAI account has available credits
- Restart the development server after adding the key

## Deployment

### Quick Deployment to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel auto-detects Next.js

3. **Add Environment Variables** (CRITICAL!)
   
   In Vercel Dashboard → Settings → Environment Variables, add:
   
   | Variable | Description |
   |----------|-------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (SECRET!) |
   | `OPENAI_API_KEY` | Your OpenAI API key |

4. **Deploy!**

**📖 For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

### Environment Variables for Production

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public/anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- `OPENAI_API_KEY` - Your OpenAI API key

⚠️ **Important:** Never commit these keys to your repository. Use environment variables in your hosting platform.

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- **Netlify** - See [DEPLOYMENT.md](./DEPLOYMENT.md#netlify)
- **Railway** - See [DEPLOYMENT.md](./DEPLOYMENT.md#railway)
- **DigitalOcean App Platform** - See [DEPLOYMENT.md](./DEPLOYMENT.md#digitalocean-app-platform)
- **Self-Hosted** - See [DEPLOYMENT.md](./DEPLOYMENT.md#self-hosting)

## Customization

### Adding New Trip Types
Edit the `tripTypes` array in `src/app/page.tsx`:

```typescript
const tripTypes = [
  { value: 'your-type', label: 'Your Custom Type' },
  // ... existing types
]
```

### Modifying Categories
Update the `CATEGORIES` array in `src/app/packing-list/page.tsx`:

```typescript
const CATEGORIES = [
  { value: 'your-category', label: 'Your Category' },
  // ... existing categories
]
```

### Customizing AI Prompts
Modify the prompt in `src/lib/openai.ts` to adjust how the AI generates recommendations.

## Performance Features

- **Caching**: API responses are cached with configurable TTL
- **Request Deduplication**: Prevents duplicate API calls
- **Lazy Loading**: Components load on demand with Suspense
- **Optimized Rendering**: Memoized components and hooks
- **Local Storage**: Trip data persists across sessions
- **Code Splitting**: Automatic route-based code splitting
- **Bundle Optimization**: Tree shaking and dead code elimination
- **Image Optimization**: Next.js automatic image optimization
- **Memory Management**: LRU cache with memory limits

## Testing

The project includes comprehensive testing:

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: API route testing
- **E2E Tests**: Playwright cross-browser testing
- **Coverage Reports**: 70%+ coverage threshold
- **Accessibility Testing**: Automated a11y checks

See [TESTING.md](./TESTING.md) for detailed testing guidelines.

## Architecture

### Frontend
- **Next.js 15**: App Router with React Server Components
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling
- **Custom Hooks**: Reusable stateful logic
- **Error Boundaries**: Graceful error handling

### Backend
- **API Routes**: Next.js serverless functions
- **OpenAI Integration**: AI-powered packing lists
- **Caching Layer**: Multi-level caching strategy
- **Rate Limiting**: Request throttling
- **Input Validation**: Comprehensive validation

### Performance Optimizations
- **Memoization**: React.memo and useMemo
- **Debouncing**: User input optimization
- **Virtual Scrolling**: Large list handling
- **Bundle Analysis**: Webpack bundle analyzer
- **Compression**: Response compression

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the GitHub issues
2. Create a new issue with detailed information
3. Include your environment details and error messages

## Documentation

- **[QUICK_START.md](./QUICK_START.md)** - 5-minute setup guide for authentication
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Detailed Supabase configuration
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide for Vercel and other platforms
- **[USER_AUTHENTICATION_GUIDE.md](./USER_AUTHENTICATION_GUIDE.md)** - Complete auth features
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Technical overview
- **[TESTING.md](./TESTING.md)** - Testing guidelines

## Roadmap

- [x] User authentication and saved trips ✅ **NEW!**
- [ ] Per-user trip history and management
- [ ] Enhanced weather integration
- [ ] Collaborative packing lists for group trips
- [ ] Mobile app version
- [ ] Offline functionality
- [ ] Integration with travel booking platforms
- [ ] Multi-language support
- [ ] Packing templates and presets
- [ ] Email notifications and reminders