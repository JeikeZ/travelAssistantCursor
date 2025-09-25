# Travel Assistant - Smart Packing Lists

A modern web application that generates personalized packing lists for travelers using AI-powered recommendations based on destination, trip duration, and trip type.

## Features

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
- **Icons**: Lucide React
- **State Management**: React Hooks with Local Storage
- **Hosting**: Vercel (recommended)

## Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key (required for personalized lists)

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
# OpenAI Configuration (Required for AI-generated lists)
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Weather API Configuration
# WEATHER_API_KEY=your_weather_api_key_here
```

### 3. Get Your OpenAI API Key

1. Go to [OpenAI API](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Generate a new API key
4. Copy the key and add it to your `.env.local` file
5. **Important**: Replace `your_openai_api_key_here` with your actual API key

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 5. Restart After Configuration

After adding your API key to `.env.local`, restart the development server:

```bash
# Stop the server (Ctrl+C) and restart
npm run dev
```

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
│   │   ├── generate-packing-list/# OpenAI integration
│   │   ├── cities/               # City search API
│   │   └── weather/              # Weather API
│   ├── completion/               # Trip completion page
│   ├── packing-list/            # Main packing list page
│   ├── simple/                  # Simple interface
│   ├── test/                    # Test page
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page (trip setup)
├── components/
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
└── lib/
    ├── openai.ts               # OpenAI integration
    └── utils.ts                # Utility functions
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
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
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

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `OPENAI_API_KEY`: Your OpenAI API key
4. Deploy automatically

### Environment Variables for Production
Make sure to add these environment variables in your hosting platform:
- `OPENAI_API_KEY` (required)
- `WEATHER_API_KEY` (optional)

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- DigitalOcean App Platform

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

- **Caching**: API responses are cached for 24 hours
- **Request Deduplication**: Prevents duplicate API calls
- **Lazy Loading**: Components load on demand
- **Optimized Rendering**: Memoized components and hooks
- **Local Storage**: Trip data persists across sessions

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

## Roadmap

- [ ] User authentication and saved trips
- [ ] Enhanced weather integration
- [ ] Collaborative packing lists for group trips
- [ ] Mobile app version
- [ ] Offline functionality
- [ ] Integration with travel booking platforms
- [ ] Multi-language support
- [ ] Packing templates and presets