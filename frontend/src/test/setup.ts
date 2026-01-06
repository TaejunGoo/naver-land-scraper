import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock any global browser APIs if needed
// Example: Mocking IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver
})
