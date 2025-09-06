import { vi } from 'vitest';

// Mock DOM methods that are not available in test environment
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true,
});

// Mock fetch globally for tests
global.fetch = vi.fn();

export {};