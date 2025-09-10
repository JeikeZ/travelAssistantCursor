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
- **Feedback System**: Post-trip survey to improve recommendations

### User Experience
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Interactive Checklist**: Check off items as you pack them
- **Location-Specific**: Recommendations based on destination climate and customs
- **Duration-Aware**: Tailored suggestions for trip length
- **Mobile-Friendly**: Works seamlessly on all devices

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: OpenAI GPT-3.5-turbo
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Hosting**: Vercel (recommended)

## Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key
- Supabase account (optional for database features)

## Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd travel-assistant
npm install
```

### 2. Environment Setup

Copy the environment example file:

```bash
cp .env.example .env.local
```

Update `.env.local` with your credentials:

```env
# OpenAI Configuration (Required)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration (Optional - for database features)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Get API Keys

#### OpenAI API Key (Required)
1. Go to [OpenAI API](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Generate a new API key
4. Add it to your `.env.local` file

#### Supabase Setup (Optional)
1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Go to Settings → API to get your URL and anon key
4. Add them to your `.env.local` file

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Schema (Supabase)

If you want to use Supabase for data persistence, create these tables:

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trips table
CREATE TABLE trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  destination_country TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  trip_type TEXT NOT NULL,
  packing_list JSONB,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table
CREATE TABLE feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  missing_items TEXT,
  would_recommend BOOLEAN NOT NULL,
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 1 AND confidence_score <= 10),
  additional_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   └── generate-packing-list/# OpenAI integration
│   ├── completion/               # Trip completion page
│   ├── packing-list/            # Main packing list page
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page (trip setup)
├── components/
│   └── ui/                      # Reusable UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Checkbox.tsx
│       ├── Input.tsx
│       ├── ProgressBar.tsx
│       └── Select.tsx
└── lib/
    ├── database.types.ts        # TypeScript types
    ├── openai.ts               # OpenAI integration
    ├── supabase.ts             # Supabase client
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

### 3. Customize Your List
- Add custom items with the "Add Custom Item" button
- Edit or delete custom items
- Mark items as essential if needed

### 4. Pack and Track Progress
- Check off items as you pack them
- Watch your progress bar fill up
- Essential items are prominently displayed

### 5. Complete and Provide Feedback
- Once 100% packed, proceed to completion
- Share your experience through the feedback form
- Help improve the service for other travelers

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
Update the `categories` array in `src/app/packing-list/page.tsx`:

```typescript
const categories = [
  { value: 'your-category', label: 'Your Category' },
  // ... existing categories
]
```

### Customizing AI Prompts
Modify the prompt in `src/lib/openai.ts` to adjust how the AI generates recommendations.

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- DigitalOcean App Platform

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
- [ ] Weather integration for climate-based suggestions
- [ ] Collaborative packing lists for group trips
- [ ] Mobile app version
- [ ] Offline functionality
- [ ] Integration with travel booking platforms
- [ ] Multi-language support