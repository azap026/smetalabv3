import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/user/route';
import * as queries from '@/lib/db/queries';
import { User } from '@/lib/db/schema';

import * as rbac from '@/lib/auth/rbac';

vi.mock('@/lib/db/queries', () => ({
    getUser: vi.fn(),
    getUserWithTeam: vi.fn(),
}));

vi.mock('@/lib/auth/rbac', () => ({
    getUserPermissions: vi.fn(),
}));

describe('User API Route', () => {
    it('should return user data when authenticated', async () => {
        const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' } as User;
        const mockPermissions = [{ code: 'projects', level: 'read' as const }];
        vi.mocked(queries.getUser).mockResolvedValue(mockUser);
        vi.mocked(rbac.getUserPermissions).mockResolvedValue(mockPermissions);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toMatchObject({
            ...mockUser,
            permissions: mockPermissions,
        });
    });

    it('should return null when not authenticated', async () => {
        vi.mocked(queries.getUser).mockResolvedValue(null);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toBeNull();
    });
});
