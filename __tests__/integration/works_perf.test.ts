import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { db } from '@/lib/db/drizzle';
import { works, users, teams, teamMembers, NewUser, NewTeam, NewWork } from '@/lib/db/schema';
import { reorderWorks } from '@/app/actions/works';
import { eq } from 'drizzle-orm';
import { getUser, getTeamForUser } from '@/lib/db/queries';

// Mock revalidatePath
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

// Mock the queries
vi.mock('@/lib/db/queries', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as object),
        getUser: vi.fn(),
        getTeamForUser: vi.fn(),
    };
});

describe('Works Reordering Performance', () => {
    let testUserId: number;
    let testTeamId: number;

    beforeEach(async () => {
        // Setup with auto-generated IDs
        const [user] = await db.insert(users).values({
            name: 'Perf User',
            email: `perf-test-${Date.now()}@test.com`,
            passwordHash: 'hash',
        }).returning();
        testUserId = user.id;

        const [team] = await db.insert(teams).values({
            name: 'Perf Team'
        }).returning();
        testTeamId = team.id;

        await db.insert(teamMembers).values({ userId: testUserId, teamId: testTeamId, role: 'admin' });

        const [insertedUser] = await db.select().from(users).where(eq(users.id, testUserId));
        const [insertedTeam] = await db.select().from(teams).where(eq(teams.id, testTeamId));

        // Mock return values
        vi.mocked(getUser).mockResolvedValue(insertedUser);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(getTeamForUser).mockResolvedValue(insertedTeam as any);
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

    it('should reorder works efficiently', { timeout: 30000 }, async () => {
        const NUM_WORKS = 200;
        const worksToInsert: NewWork[] = [];
        for (let i = 0; i < NUM_WORKS; i++) {
            worksToInsert.push({
                tenantId: testTeamId,
                code: `W-${i}`,
                name: `Work ${i}`,
                status: 'active',
                phase: 'Stage 1',
                sortOrder: (NUM_WORKS - i) * 10 // Reverse order to test sorting
            });
        }
        await db.insert(works).values(worksToInsert);

        const start = performance.now();
        // reorderWorks now resets sortOrder to 100, 200, 300...
        const result = await reorderWorks();
        const end = performance.now();

        expect(result.success).toBe(true);
        // console.log(`Reorder execution time: ${(end - start).toFixed(2)}ms`);

        // Verify order
        const reorderedWorks = await db.query.works.findMany({
            where: eq(works.tenantId, testTeamId),
            orderBy: (works, { asc }) => [asc(works.sortOrder)],
        });

        expect(reorderedWorks).toHaveLength(NUM_WORKS);

        const firstItem = reorderedWorks[0];
        const lastItem = reorderedWorks[NUM_WORKS - 1];

        expect(firstItem.sortOrder).toBe(100);
        expect(lastItem.sortOrder).toBe(NUM_WORKS * 100);
    });
});
