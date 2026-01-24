import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/user/route';
import * as queries from '@/lib/db/queries';
import { User } from '@/lib/db/schema';

vi.mock('@/lib/db/queries', () => ({
    getUser: vi.fn(),
}));

describe('User API Route', () => {
    it('should return user data when authenticated', async () => {
        const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' } as User;
        vi.mocked(queries.getUser).mockResolvedValue(mockUser);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(mockUser);
    });

    it('should return null when not authenticated', async () => {
        vi.mocked(queries.getUser).mockResolvedValue(null);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toBeNull();
    });
});
