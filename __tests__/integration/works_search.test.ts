
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { db } from '@/lib/db/drizzle';
import { works, users, teams, teamMembers, NewWork } from '@/lib/db/schema';
import { searchWorks } from '@/app/actions/works/search-ai';
import { WorksService } from '@/lib/services/works.service';
import { eq } from 'drizzle-orm';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { generateEmbedding } from '@/lib/ai/embeddings';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/ai/embeddings', () => ({ generateEmbedding: vi.fn() }));

vi.mock('@/lib/db/queries', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as object),
        getUser: vi.fn(),
        getTeamForUser: vi.fn(),
    };
});

describe('Works Search and Batch Operations', () => {
    let testUserId: number;
    let testTeamId: number;

    beforeEach(async () => {
        const [user] = await db.insert(users).values({
            name: 'Search User',
            email: `search-test-${Date.now()}@test.com`,
            passwordHash: 'hash',
        }).returning();
        testUserId = user.id;

        const [team] = await db.insert(teams).values({ name: 'Search Team' }).returning();
        testTeamId = team.id;

        await db.insert(teamMembers).values({ userId: testUserId, teamId: testTeamId, role: 'admin' });

        vi.mocked(getUser).mockResolvedValue(user);
        vi.mocked(getTeamForUser).mockResolvedValue(team as unknown as Awaited<ReturnType<typeof getTeamForUser>>);
    });

    afterEach(async () => {
        if (testTeamId) {
            await db.delete(works).where(eq(works.tenantId, testTeamId));
            await db.delete(teamMembers).where(eq(teamMembers.teamId, testTeamId));
            await db.delete(teams).where(eq(teams.id, testTeamId));
        }
        if (testUserId) {
            await db.delete(users).where(eq(users.id, testUserId));
        }
        vi.resetAllMocks();
    });

    it('should search works using AI embeddings', async () => {
        // Arrange
        const mockVector = new Array(1536).fill(0.1);
        vi.mocked(generateEmbedding).mockResolvedValue(mockVector);

        await db.insert(works).values({
            tenantId: testTeamId,
            code: 'SEARCH-1',
            name: 'Specialized Painting Work',
            embedding: mockVector,
            status: 'active'
        });

        // Act
        const result = await searchWorks('painting');

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toHaveLength(1);
            expect(result.data[0].name).toBe('Specialized Painting Work');
        }
    });

    it('should upsert many works correctly', async () => {
        // Arrange
        const manyWorks: NewWork[] = [
            { tenantId: testTeamId, code: 'B-1', name: 'Batch 1', sortOrder: 100 },
            { tenantId: testTeamId, code: 'B-2', name: 'Batch 2', sortOrder: 200 },
        ];

        // Act
        const result = await WorksService.upsertMany(testTeamId, manyWorks);

        // Assert
        expect(result.success).toBe(true);
        const inDb = await db.select().from(works).where(eq(works.tenantId, testTeamId)).orderBy(works.sortOrder);
        expect(inDb).toHaveLength(2);
        expect(inDb[0].code).toBe('B-1');
        expect(inDb[1].code).toBe('B-2');

        // Update one and add one
        const mixedWorks: NewWork[] = [
            { tenantId: testTeamId, code: 'B-1', name: 'Batch 1 Updated' },
            { tenantId: testTeamId, code: 'B-3', name: 'Batch 3' },
        ];

        await WorksService.upsertMany(testTeamId, mixedWorks);

        const afterUpdate = await db.select().from(works).where(eq(works.tenantId, testTeamId)).orderBy(works.sortOrder);
        expect(afterUpdate).toHaveLength(3);
        const updated = afterUpdate.find(w => w.code === 'B-1');
        expect(updated?.name).toBe('Batch 1 Updated');
    });
});
