import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Login } from '@/app/(login)/login';
import * as React from 'react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => null,
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock server actions
vi.mock('@/app/(login)/actions', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

// Mock useActionState
// We need to use vi.hoisted to share variables between the mock factory and the tests
const { useActionStateMock } = vi.hoisted(() => {
  return { useActionStateMock: vi.fn() };
});

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useActionState: useActionStateMock,
  };
});

describe('Login Component UX', () => {
  beforeEach(() => {
    useActionStateMock.mockImplementation((action, initialState) => [initialState, action, false]);
  });

  it('toggles password visibility', () => {
    render(<Login mode="signin" />);

    const passwordInput = screen.getByLabelText('Password');
    // The button might not have a label text if aria-label is used, but getByLabelText supports aria-label
    const toggleButton = screen.getByLabelText('Show password');

    // Initial state: password hidden
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button
    fireEvent.click(toggleButton);

    // Password should be visible
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(toggleButton).toHaveAttribute('aria-label', 'Hide password');

    // Click toggle button again
    fireEvent.click(toggleButton);

    // Password should be hidden again
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(toggleButton).toHaveAttribute('aria-label', 'Show password');
  });

  it('displays error message with accessible attributes', () => {
    // Return an error state
    useActionStateMock.mockImplementation((action, initialState) => [{ error: 'Invalid credentials' }, action, false]);

    render(<Login mode="signin" />);

    const errorDiv = screen.getByText('Invalid credentials');
    expect(errorDiv).toBeInTheDocument();
    expect(errorDiv).toHaveAttribute('role', 'alert');
    expect(errorDiv).toHaveAttribute('aria-live', 'polite');
  });
});
