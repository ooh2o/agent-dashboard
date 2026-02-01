'use client';

import { QueryClient } from '@tanstack/react-query';

/**
 * Create a query client with default options optimized for
 * real-time dashboard data.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 30 seconds
        staleTime: 30 * 1000,
        // Cache data for 5 minutes
        gcTime: 5 * 60 * 1000,
        // Retry failed requests 3 times
        retry: 3,
        // Don't refetch on window focus by default (SSE handles real-time)
        refetchOnWindowFocus: false,
        // Refetch on reconnect
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

// Singleton for client-side usage
let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  // Server: always create a new client
  if (typeof window === 'undefined') {
    return createQueryClient();
  }

  // Browser: reuse client
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }
  return browserQueryClient;
}
