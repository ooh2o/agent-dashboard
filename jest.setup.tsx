import '@testing-library/jest-dom';

// Polyfill Web APIs for testing
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Only setup browser mocks in jsdom environment
if (typeof window !== 'undefined') {
  // Mock window.matchMedia
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

  // Mock ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
}

// Mock framer-motion to avoid animation issues in tests (only in browser environment)
if (typeof window !== 'undefined') {
  jest.mock('framer-motion', () => {
    const actual = jest.requireActual('framer-motion');
    return {
      ...actual,
      motion: {
        div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
          const { initial, animate, exit, transition, whileHover, whileTap, drag, dragControls, dragMomentum, dragListener, onDragEnd, ...rest } = props;
          return <div {...rest}>{children}</div>;
        },
        button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
          const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
          return <button {...rest}>{children}</button>;
        },
      },
      AnimatePresence: ({ children }: React.PropsWithChildren<unknown>) => <>{children}</>,
      useDragControls: () => ({
        start: jest.fn(),
      }),
    };
  });

  // Mock window dimensions
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    value: 1920,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    value: 1080,
  });
}

// Suppress console errors during tests (optional - can be commented out for debugging)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
