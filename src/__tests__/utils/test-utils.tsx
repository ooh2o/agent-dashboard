import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Test wrapper that provides necessary providers
interface AllProvidersProps {
  children: ReactNode;
}

function AllProviders({ children }: AllProvidersProps) {
  return (
    <>
      {children}
    </>
  );
}

// Custom render function
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Setup user event with custom render
function setup(jsx: ReactElement) {
  return {
    user: userEvent.setup(),
    ...customRender(jsx),
  };
}

// Re-export everything from RTL
export * from '@testing-library/react';
export { customRender as render, setup };
