import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationBell } from '@/components/notification-bell';
import { vi, describe, it, expect } from 'vitest';
import React from 'react';

// Mock SWR
vi.mock('swr', () => ({
  default: () => ({
    data: [
      {
        id: 1,
        title: 'Test Notification',
        description: 'This is a test notification',
        createdAt: new Date().toISOString(),
        read: false,
      },
    ],
    isLoading: false,
  }),
  mutate: vi.fn(),
}));

describe('NotificationBell', () => {
  it('renders notifications as interactive buttons', async () => {
    render(<NotificationBell />);

    // Find the bell button
    const bellButton = await screen.findByRole('button', { name: /уведомления/i });
    expect(bellButton).toBeInTheDocument();

    // Click to open popover
    fireEvent.click(bellButton);

    // Wait for popover content
    await waitFor(() => {
        expect(screen.getByText('Test Notification')).toBeInTheDocument();
    });

    // Verify that the notification item is a button.
    // This is expected to fail initially.
    const notificationItem = screen.getByRole('button', { name: /Test Notification/i });
    expect(notificationItem).toBeInTheDocument();
  });
});
