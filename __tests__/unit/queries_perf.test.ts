import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getTeamForUser } from '@/lib/db/queries';

// Mock dependencies
const mockCookies = {
  get: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => mockCookies),
}));

vi.mock('@/lib/auth/session', () => ({
  verifyToken: vi.fn(),
}));

// We need to mock drizzle db
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnValue([]),
    query: {
      teamMembers: {
        findFirst: vi.fn(),
      },
    },
  },
}));

describe('getTeamForUser Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call cookies() to get session when no userId is provided', async () => {
    // Setup
    mockCookies.get.mockReturnValue({ value: 'some-token' });

    try {
        await getTeamForUser();
    } catch (e) {
        // We don't care about the result, just the side effect on cookies
    }

    expect(mockCookies.get).toHaveBeenCalledWith('session');
  });

  it('should NOT call cookies() when userId is provided', async () => {
    // Setup
    // mockCookies.get is NOT expected to be called
    mockCookies.get.mockClear();

    try {
        await getTeamForUser(123);
    } catch (e) {
        // Ignore db errors
    }

    expect(mockCookies.get).not.toHaveBeenCalled();
  });
});
