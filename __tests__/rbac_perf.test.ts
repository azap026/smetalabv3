import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserPermissions } from '@/lib/auth/rbac';
import { users, type User } from '@/lib/db/schema';

const mocks = vi.hoisted(() => {
  const mockLimit = vi.fn().mockResolvedValue([]);

  const queryBuilder = {
    innerJoin: vi.fn(),
    where: vi.fn(),
    limit: mockLimit,
    then: (resolve: (val: unknown[]) => void) => resolve([]) // Default empty array for non-limited queries
  };

  queryBuilder.innerJoin.mockReturnValue(queryBuilder);
  queryBuilder.where.mockReturnValue(queryBuilder);

  const mockFrom = vi.fn().mockReturnValue(queryBuilder);
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

  return { mockSelect, mockFrom, mockLimit };
});

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: mocks.mockSelect,
  },
}));

describe('getUserPermissions Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockLimit.mockResolvedValue([]);
  });

  it('fetches user from DB when userId is number', async () => {
    // Mock user found
    mocks.mockLimit.mockResolvedValueOnce([{ id: 1, platformRole: 'member' }]);

    await getUserPermissions(1, null);

    // Verify 'from' was called with 'users' table
    expect(mocks.mockFrom).toHaveBeenCalledWith(users);
  });

  it('does NOT fetch user from DB when user object is passed', async () => {
    const userObj = { id: 1, platformRole: 'member' } as unknown as User;
    await getUserPermissions(userObj, null);

    // Verify 'from' was NOT called with 'users' table
    expect(mocks.mockFrom).not.toHaveBeenCalledWith(users);
  });
});
