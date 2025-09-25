import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor(input, init = {}) {
      const url = typeof input === 'string' ? input : input.url
      Object.defineProperty(this, 'url', {
        value: url,
        writable: false,
        configurable: true
      })
      this.method = init?.method || 'GET'
      this.headers = new Map(Object.entries(init?.headers || {}))
      this.body = init?.body
      this.searchParams = new URL(url).searchParams
    }
    
    json() {
      return Promise.resolve(JSON.parse(this.body || '{}'))
    }
  },
  NextResponse: {
    json: (data, init = {}) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      headers: {
        set: jest.fn(),
        get: jest.fn()
      }
    })
  }
}))

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-api-key'

// Add TextEncoder/TextDecoder for Node.js compatibility
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Next.js Request and Response
global.Request = class MockRequest {
  constructor(input, init = {}) {
    const url = typeof input === 'string' ? input : input.url
    Object.defineProperty(this, 'url', {
      value: url,
      writable: false,
      configurable: true
    })
    this.method = init?.method || 'GET'
    this.headers = new Map(Object.entries(init?.headers || {}))
    this.body = init?.body
  }
  
  json() {
    return Promise.resolve(JSON.parse(this.body || '{}'))
  }
}

global.Response = class MockResponse {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status || 200
    this.headers = new Map(Object.entries(init.headers || {}))
  }
  
  json() {
    return Promise.resolve(JSON.parse(this.body))
  }
}

// Mock AbortController
global.AbortController = class MockAbortController {
  constructor() {
    this.signal = { aborted: false }
  }
  
  abort() {
    this.signal.aborted = true
  }
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock fetch globally
global.fetch = jest.fn()

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
})

// Increase timeout for async operations
jest.setTimeout(10000)