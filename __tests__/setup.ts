import '@testing-library/jest-dom'

// Mock matchMedia if it's not available in JSDOM
if (typeof window !== 'undefined') {
  window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
    }
  }
}

// Mock ResizeObserver
if (typeof window !== 'undefined') {
  window.ResizeObserver = window.ResizeObserver || jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))
} 