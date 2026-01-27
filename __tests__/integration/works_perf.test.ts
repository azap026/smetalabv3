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

const testUser: NewUser = { id: 8888, name: 'Perf User', email: 'perf-test@test.com', passwordHash: 'hash' };
const testTeam: NewTeam = { id: 8888, name: 'Perf Team' };

describe('Works Reordering Performance', () => {
    beforeEach(async () => {
        // Cleanup
        await db.delete(works).where(eq(works.tenantId, testTeam.id));
        await db.delete(teamMembers).where(eq(teamMembers.teamId, testTeam.id));
        await db.delete(users).where(eq(users.id, testUser.id!));
        await db.delete(teams).where(eq(teams.id, testTeam.id!));

        // Setup
        await db.insert(users).values(testUser);
        await db.insert(teams).values(testTeam);
        await db.insert(teamMembers).values({ userId: testUser.id!, teamId: testTeam.id!, role: 'admin' });

        const [insertedUser] = await db.select().from(users).where(eq(users.id, testUser.id!));
        const [insertedTeam] = await db.select().from(teams).where(eq(teams.id, testTeam.id!));

        // Mock return values
        vi.mocked(getUser).mockResolvedValue(insertedUser);
        vi.mocked(getTeamForUser).mockResolvedValue(insertedTeam);
    });

    afterEach(async () => {
        await db.delete(works).where(eq(works.tenantId, testTeam.id));
        await db.delete(teamMembers).where(eq(teamMembers.teamId, testTeam.id));
        await db.delete(users).where(eq(users.id, testUser.id!));
        await db.delete(teams).where(eq(teams.id, testTeam.id!));
        vi.resetAllMocks();
    });

    it('should reorder works efficiently', async () => {
        const NUM_WORKS = 200;
        const worksToInsert: NewWork[] = [];
        for (let i = 0; i < NUM_WORKS; i++) {
            worksToInsert.push({
                tenantId: testTeam.id,
                code: `9.${i + 1}`, // Wrong prefix to force reordering (9.x -> 1.x)
                name: `Work ${i}`,
                status: 'active',
                phase: 'Stage 1'
            });
        }
        await db.insert(works).values(worksToInsert);

        const start = performance.now();
        const result = await reorderWorks();
        const end = performance.now();

        expect(result.success).toBe(true);
        console.log(`Reorder execution time: ${(end - start).toFixed(2)}ms`);

        // Verify order
        const reorderedWorks = await db.query.works.findMany({
            where: eq(works.tenantId, testTeam.id),
        });

        // Sort using natural sort order to match logical expectations
        reorderedWorks.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

        expect(reorderedWorks).toHaveLength(NUM_WORKS);
        expect(reorderedWorks[0].code).toBe('1.1');
        expect(reorderedWorks[NUM_WORKS - 1].code).toBe(`1.${NUM_WORKS}`);
    });
});
