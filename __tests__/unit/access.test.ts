/* eslint-disable */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkAccess, isPlatformAdmin, isSuperadmin, getUserTeamRole } from '@/lib/auth/access';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { hasPermission } from '@/lib/auth/rbac';

// Mock dependencies
vi.mock('@/lib/db/queries');
vi.mock('@/lib/db/drizzle');
vi.mock('@/lib/auth/rbac');

const mockGetUser = vi.mocked(getUser);
const mockDb = vi.mocked(db, true);
const mockHasPermission = vi.mocked(hasPermission);

const mockUser = { id: 1, name: 'Test User', email: 'test@test.com', platformRole: 'user' };
const mockAdminUser = { ...mockUser, platformRole: 'admin' };
const mockSuperAdminUser = { ...mockUser, platformRole: 'superadmin' };
const mockSupportUser = { ...mockUser, platformRole: 'support' };

describe('Authentication Access Control', () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('isSuperadmin', () => {
        it('should return true if user has superadmin role', async () => {
            mockGetUser.mockResolvedValue(mockSuperAdminUser);
            expect(await isSuperadmin()).toBe(true);
        });

        it('should return false if user does not have superadmin role', async () => {
            mockGetUser.mockResolvedValue(mockAdminUser);
            expect(await isSuperadmin()).toBe(false);
        });

        it('should return false if there is no user', async () => {
            mockGetUser.mockResolvedValue(null);
            expect(await isSuperadmin()).toBe(false);
        });
    });

    describe('isPlatformAdmin', () => {
        it('should return true for superadmin', async () => {
            mockGetUser.mockResolvedValue(mockSuperAdminUser);
            expect(await isPlatformAdmin()).toBe(true);
        });

        it('should return true for support role', async () => {
            mockGetUser.mockResolvedValue(mockSupportUser);
            expect(await isPlatformAdmin()).toBe(true);
        });

        it('should return false for other roles', async () => {
            mockGetUser.mockResolvedValue(mockAdminUser);
            expect(await isPlatformAdmin()).toBe(false);
        });
    });

    describe('getUserTeamRole', () => {
        it("should return the user's role in a team", async () => {
            const mockMembership = [{ role: 'manager' }];
            // @ts-expect-error Testing invalid role
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue(mockMembership),
            });
            const role = await getUserTeamRole(1, 101);
            expect(role).toBe('manager');
        });

        it('should return null if user is not in the team', async () => {
            // @ts-expect-error Testing invalid role
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue([]),
            });
            const role = await getUserTeamRole(1, 101);
            expect(role).toBeNull();
        });
    });

    describe('checkAccess', () => {
        it('should return unauthorized if no user is logged in', async () => {
            mockGetUser.mockResolvedValue(null);
            const result = await checkAccess('estimates.create');
            expect(result).toEqual({ authorized: false, user: null, tenantId: null });
        });

        it('should use provided tenantId and grant access', async () => {
            mockGetUser.mockResolvedValue(mockUser);
            mockHasPermission.mockResolvedValue(true);

            const result = await checkAccess('estimates.create', 101);

            expect(mockHasPermission).toHaveBeenCalledWith(mockUser.id, 101, 'estimates.create', 'read');
            expect(result.authorized).toBe(true);
            expect(result.tenantId).toBe(101);
        });

        it('should resolve tenantId if not provided and grant access', async () => {
            mockGetUser.mockResolvedValue(mockUser);
            const mockMembership = [{ teamId: 102 }];
            // @ts-expect-error Testing invalid role
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue(mockMembership),
            });
            mockHasPermission.mockResolvedValue(true);

            const result = await checkAccess('estimates.create');

            expect(mockHasPermission).toHaveBeenCalledWith(mockUser.id, 102, 'estimates.create', 'read');
            expect(result.authorized).toBe(true);
            expect(result.tenantId).toBe(102);
        });

        it('should return tenantId as null if not provided and not found', async () => {
            mockGetUser.mockResolvedValue(mockUser);
            mockHasPermission.mockResolvedValue(false);
            // @ts-expect-error Testing invalid role
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue([]),
            });

            const result = await checkAccess('estimates.create');

            expect(mockHasPermission).toHaveBeenCalledWith(mockUser.id, null, 'estimates.create', 'read');
            expect(result.authorized).toBe(false);
            expect(result.tenantId).toBeNull();
        });
    });
});
