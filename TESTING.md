# Testing Guidelines

This document outlines the testing strategy and guidelines for the Travel Assistant project.

## Testing Stack

### Unit and Integration Tests
- **Jest**: Test runner and assertion library
- **React Testing Library**: React component testing utilities
- **jsdom**: DOM implementation for Node.js

### End-to-End Tests
- **Playwright**: Browser automation and E2E testing
- **Multiple browsers**: Chrome, Firefox, Safari, and mobile viewports

## Test Structure

```
__tests__/
├── api/                    # API route tests
│   ├── cities.test.ts
│   ├── weather.test.ts
│   └── generate-packing-list.test.ts
├── components/             # Component tests
│   └── ui/
│       ├── Button.test.tsx
│       ├── Input.test.tsx
│       └── CitySearchInput.test.tsx
├── hooks/                  # Custom hook tests
│   ├── usePackingList.test.ts
│   └── useDebounce.test.ts
└── lib/                    # Utility function tests
    ├── utils.test.ts
    └── cache.test.ts

e2e/
└── travel-flow.spec.ts     # End-to-end tests
```

## Running Tests

### All Tests
```bash
npm run test:all
```

### Unit Tests Only
```bash
npm test
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

### End-to-End Tests
```bash
npm run test:e2e
npm run test:e2e:ui     # With UI mode
```

### Type Checking
```bash
npm run type-check
```

## Writing Tests

### Unit Tests

#### API Routes
```typescript
import { GET } from '@/app/api/cities/route'
import { NextRequest } from 'next/server'

describe('/api/cities', () => {
  it('should return cities for valid query', async () => {
    const request = new NextRequest('http://localhost:3000/api/cities?q=Tokyo')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.cities).toBeDefined()
  })
})
```

#### React Components
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

#### Custom Hooks
```typescript
import { renderHook, act } from '@testing-library/react'
import { usePackingList } from '@/hooks/usePackingList'

describe('usePackingList', () => {
  it('toggles item packed status', () => {
    const { result } = renderHook(() => usePackingList())
    
    act(() => {
      result.current.toggleItemPacked('item-1')
    })
    
    // Assert expected behavior
  })
})
```

### End-to-End Tests

```typescript
import { test, expect } from '@playwright/test'

test('complete travel planning flow', async ({ page }) => {
  await page.goto('/')
  
  // Fill out form
  await page.fill('[placeholder*="destination"]', 'Tokyo')
  await page.selectOption('select', '7')
  await page.click('button[type="submit"]')
  
  // Verify navigation
  await expect(page).toHaveURL('/packing-list')
})
```

## Test Coverage

### Coverage Thresholds
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Coverage Reports
- Text output in terminal
- HTML report in `coverage/` directory
- LCOV report for CI/CD integration

## Testing Best Practices

### General
1. **Write tests first** (TDD approach when possible)
2. **Test behavior, not implementation**
3. **Use descriptive test names**
4. **Keep tests simple and focused**
5. **Clean up after tests** (mocks, timers, etc.)

### Unit Tests
1. **Mock external dependencies**
2. **Test edge cases and error conditions**
3. **Use proper assertions**
4. **Avoid testing implementation details**

### Component Tests
1. **Test user interactions**
2. **Verify accessibility**
3. **Test responsive behavior**
4. **Mock API calls**

### E2E Tests
1. **Test critical user journeys**
2. **Use page object patterns for complex flows**
3. **Test on multiple browsers and devices**
4. **Handle flaky tests with proper waits**

## Mocking Strategy

### API Calls
```typescript
// Mock fetch globally
global.fetch = jest.fn()

// Mock specific responses
;(global.fetch as jest.Mock).mockResolvedValueOnce({
  ok: true,
  json: async () => ({ data: 'test' })
})
```

### Next.js Router
```typescript
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      // ... other router methods
    }
  }
}))
```

### Local Storage
```typescript
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock
```

## Debugging Tests

### Jest
```bash
# Run specific test file
npm test -- Button.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="handles click"

# Debug with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Playwright
```bash
# Run with debug mode
npm run test:e2e -- --debug

# Run with headed browser
npm run test:e2e -- --headed

# Run specific test
npm run test:e2e -- travel-flow.spec.ts
```

## Continuous Integration

### GitHub Actions
```yaml
- name: Run Tests
  run: |
    npm test -- --coverage --watchAll=false
    npm run test:e2e
```

### Pre-commit Hooks
```bash
# Run tests before commit
npm test -- --passWithNoTests
npm run type-check
```

## Performance Testing

### Bundle Analysis
```bash
npm run analyze
```

### Lighthouse CI
- Automated performance testing
- Accessibility audits
- SEO checks

## Accessibility Testing

### Automated Testing
- `@testing-library/jest-dom` matchers
- `axe-core` integration
- ARIA attribute validation

### Manual Testing
- Keyboard navigation
- Screen reader compatibility
- Color contrast validation

## Common Issues

### Jest Configuration
- Module resolution issues with `@/` imports
- NextJS-specific mocking requirements
- Environment variable setup

### Playwright Issues
- Browser compatibility
- Flaky tests due to timing
- Viewport and responsive testing

### React Testing Library
- Async operations and waitFor
- User event vs fireEvent
- Query selection strategies

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)