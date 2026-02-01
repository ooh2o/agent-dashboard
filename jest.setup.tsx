import '@testing-library/jest-dom';

// Polyfill Web APIs for testing
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Polyfill Request/Response for API route tests in node environment
if (typeof Request === 'undefined') {
  global.Request = jest.fn().mockImplementation((url: string, init?: RequestInit) => ({
    url,
    method: init?.method || 'GET',
    headers: new Map(Object.entries(init?.headers || {})),
    json: async () => init?.body ? JSON.parse(init.body as string) : {},
    text: async () => init?.body as string || '',
  })) as unknown as typeof Request;
}

if (typeof Response === 'undefined') {
  global.Response = jest.fn().mockImplementation((body: BodyInit | null, init?: ResponseInit) => ({
    ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
    status: init?.status || 200,
    statusText: init?.statusText || 'OK',
    headers: new Map(Object.entries(init?.headers || {})),
    json: async () => typeof body === 'string' ? JSON.parse(body) : body,
    text: async () => typeof body === 'string' ? body : JSON.stringify(body),
  })) as unknown as typeof Response;
}

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
