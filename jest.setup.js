// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import ResizeObserver from 'resize-observer-polyfill';

if (typeof global !== "undefined" && typeof global.ResizeObserver === "undefined") {
  global.ResizeObserver = ResizeObserver;
}

if (typeof Element!=="undefined" && typeof Element.prototype.scrollTo === "undefined") {
    // mock scrollTo for tests that may call it
    Element.prototype.scrollTo = jest.fn();
}

if (typeof global !== "undefined" && typeof global.structuredClone === 'undefined') {
    global.structuredClone = function(obj) {
        if (arguments.length === 0) {
            throw new TypeError('structuredClone requires at least 1 argument');
        }
        if (obj === undefined) return undefined;
        return JSON.parse(JSON.stringify(obj));
    };
}

if (typeof window!=="undefined" && typeof window.matchMedia === 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
}

// Mock jose module for server-side testing
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-token'),
  })),
  jwtVerify: jest.fn().mockResolvedValue({
    payload: { userId: 'test-user' },
  }),
}));

// Mock next/headers cookies function
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  }),
}));
