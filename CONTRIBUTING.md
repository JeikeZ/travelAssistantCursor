# Contributing to Travel Assistant

Thank you for your interest in contributing to Travel Assistant! This guide will help you get started.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Review Process](#review-process)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Expected Behavior

- Be respectful and constructive
- Welcome newcomers and help them learn
- Focus on what is best for the project
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Publishing others' private information
- Any conduct that could be considered inappropriate in a professional setting

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- Supabase account (for database features)
- OpenAI API key (for AI features)

### First Time Setup

1. **Fork the Repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/travel-assistant.git
   cd travel-assistant
   ```

2. **Add Upstream Remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/travel-assistant.git
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Setup Environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your credentials
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

---

## Development Setup

### Environment Variables

Required environment variables:

```env
# Supabase (Required for auth and database)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenAI (Required for AI features)
OPENAI_API_KEY=your-openai-api-key

# Optional
WEATHER_API_KEY=your-weather-api-key
```

### Database Setup

1. Create Supabase project
2. Run migrations from `/migrations` folder
3. Set up Row Level Security policies
4. Configure API keys

See [SETUP.md](./SETUP.md) for detailed instructions.

---

## Project Structure

```
src/
├── app/              # Next.js App Router pages and API routes
├── components/       # React components
├── hooks/            # Custom React hooks
├── lib/              # Utility libraries
└── types/            # TypeScript type definitions
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete structure.

---

## Coding Standards

### TypeScript

- **Always use TypeScript** for new files
- Define proper types for all functions and components
- Avoid `any` type - use `unknown` if type is truly unknown
- Use interfaces for objects, types for unions/intersections

**Good:**
```typescript
interface User {
  id: string
  username: string
  isGuest: boolean
}

function getUserById(id: string): Promise<User | null> {
  // ...
}
```

**Bad:**
```typescript
function getUserById(id: any): any {
  // ...
}
```

### React Components

- Use functional components with hooks
- Props should be typed with interfaces
- Use meaningful component names
- Keep components focused and single-purpose

**Good:**
```typescript
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

export function Button({ label, onClick, variant = 'primary', disabled }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  )
}
```

### File Naming

- Components: `PascalCase.tsx` (e.g., `TripCard.tsx`)
- Hooks: `camelCase.ts` (e.g., `useTrips.ts`)
- Utilities: `camelCase.ts` (e.g., `validation.ts`)
- Types: `camelCase.ts` (e.g., `database.ts`)

### Code Style

- **Formatting**: Use Prettier (configured in project)
- **Linting**: Follow ESLint rules (configured in project)
- **Line Length**: Max 100 characters
- **Indentation**: 2 spaces
- **Quotes**: Single quotes for TS/JS, double for JSX attributes
- **Semicolons**: Required

### Imports

Order imports as follows:

```typescript
// 1. React/Next.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. Third-party libraries
import { supabaseClient } from '@supabase/supabase-js'

// 3. Internal components
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

// 4. Internal utilities
import { formatDate } from '@/lib/utils'
import { validateTrip } from '@/lib/validation'

// 5. Types
import type { Trip, User } from '@/types'

// 6. Styles
import styles from './Component.module.css'
```

### Comments

- Write self-documenting code
- Add comments for complex logic
- Use JSDoc for functions and components
- Explain "why", not "what"

**Good:**
```typescript
/**
 * Generates a packing list using OpenAI based on trip details.
 * Falls back to a basic list if the API is unavailable.
 */
async function generatePackingList(trip: TripData): Promise<PackingItem[]> {
  // Try AI generation first, as it provides better recommendations
  try {
    return await openai.generateList(trip)
  } catch (error) {
    // Log error for debugging but don't fail - use fallback
    console.error('OpenAI unavailable:', error)
    return getBasicPackingList(trip)
  }
}
```

---

## Making Changes

### Branching Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/update-description` - Documentation updates
- `refactor/component-name` - Refactoring

### Creating a Feature Branch

```bash
# Update your local main branch
git checkout main
git pull upstream main

# Create a new feature branch
git checkout -b feature/trip-export

# Make your changes...
git add .
git commit -m "feat: add trip export to PDF"

# Push to your fork
git push origin feature/trip-export
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```bash
feat: add trip duplication feature
fix: resolve race condition in auto-save
docs: update setup instructions for Supabase
refactor: extract auth logic into middleware
test: add tests for trip validation
```

---

## Testing

### Running Tests

```bash
# Unit tests
npm test

# Unit tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# All tests
npm run test:all
```

### Writing Tests

- **Test files**: Place next to source files with `.test.ts` or `.test.tsx`
- **Coverage**: Aim for 70%+ coverage
- **Descriptive names**: Use clear test descriptions

**Example:**
```typescript
// useTrips.test.ts
import { renderHook, act } from '@testing-library/react'
import { useTrips } from './useTrips'

describe('useTrips', () => {
  it('should fetch trips on mount', async () => {
    const { result } = renderHook(() => useTrips())
    
    expect(result.current.isLoading).toBe(true)
    
    await act(async () => {
      await result.current.fetchTrips()
    })
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.trips).toHaveLength(3)
  })
  
  it('should handle fetch errors gracefully', async () => {
    // Mock API error
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('API Error'))
    
    const { result } = renderHook(() => useTrips())
    
    await act(async () => {
      await result.current.fetchTrips()
    })
    
    expect(result.current.error).toBe('Failed to fetch trips')
  })
})
```

### Test Coverage

Ensure your changes include tests:

- [ ] Unit tests for new functions/utilities
- [ ] Component tests for new UI components
- [ ] Integration tests for API routes
- [ ] E2E tests for critical user flows

---

## Submitting Changes

### Before Submitting

1. **Run all tests**
   ```bash
   npm run test:all
   ```

2. **Run linter**
   ```bash
   npm run lint
   ```

3. **Check types**
   ```bash
   npm run type-check
   ```

4. **Test locally**
   ```bash
   npm run build
   npm run start
   ```

5. **Update documentation** if needed

### Creating a Pull Request

1. **Push to your fork**
   ```bash
   git push origin feature/your-feature
   ```

2. **Open Pull Request on GitHub**
   - Use a descriptive title
   - Reference related issues
   - Provide detailed description
   - Add screenshots for UI changes
   - List testing performed

### Pull Request Template

```markdown
## Description
Brief description of changes

## Related Issues
Fixes #123

## Changes Made
- Added trip export feature
- Updated UI components
- Added tests

## Screenshots (if UI changes)
[Add screenshots here]

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manually tested on Chrome
- [ ] Manually tested on Firefox
- [ ] Tested on mobile

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console errors
- [ ] Accessibility checked
```

---

## Review Process

### What to Expect

1. **Automated Checks**: CI/CD runs tests and linting
2. **Code Review**: Maintainers review your code
3. **Feedback**: You may receive change requests
4. **Approval**: Once approved, your PR will be merged

### Review Criteria

- Code quality and style
- Test coverage
- Documentation
- Performance impact
- Security implications
- Accessibility
- Mobile responsiveness

### Addressing Feedback

```bash
# Make requested changes
git add .
git commit -m "fix: address review feedback"
git push origin feature/your-feature
```

---

## Development Tips

### Hot Reload

Next.js supports hot reload - changes appear instantly during development.

### Debugging

- Use browser DevTools
- Check server logs in terminal
- Use React DevTools extension
- Check Supabase logs for database issues

### Common Issues

**Build Errors:**
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

**Type Errors:**
- Check TypeScript version matches project
- Clear TypeScript cache
- Restart TS server in IDE

**Database Errors:**
- Verify Supabase credentials
- Check RLS policies
- Verify migrations ran successfully

---

## Getting Help

### Resources

- [README.md](./README.md) - Project overview
- [SETUP.md](./SETUP.md) - Setup instructions
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical details
- [API.md](./API.md) - API documentation

### Communication

- GitHub Issues - Bug reports and feature requests
- GitHub Discussions - Questions and ideas
- Pull Request comments - Code-specific discussions

---

## Recognition

Contributors will be:
- Listed in project contributors
- Credited in release notes
- Mentioned in documentation (for significant contributions)

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Travel Assistant! 🎉**
