
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers, works } from '@/lib/db/schema';
import { updateWork, deleteWork } from '@/app/actions/works/crud';
import { eq, and } from 'drizzle-orm';
import { getUser, getTeamForUser } from '@/lib/db/queries';

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

describe('Cross-Tenant Security Regression', () => {
    let userAId: number, userBId: number;
    let teamAId: number, teamBId: number;
    let workBId: string;

    beforeEach(async () => {
        // Create Team A and User A
        const [teamA] = await db.insert(teams).values({ name: 'Team A' }).returning();
        teamAId = teamA.id;
        const [userA] = await db.insert(users).values({ name: 'User A', email: `a-${Date.now()}@test.com`, passwordHash: 'h' }).returning();
        userAId = userA.id;
        await db.insert(teamMembers).values({ userId: userAId, teamId: teamAId, role: 'admin' });

        // Create Team B and User B
        const [teamB] = await db.insert(teams).values({ name: 'Team B' }).returning();
        teamBId = teamB.id;
        const [userB] = await db.insert(users).values({ name: 'User B', email: `b-${Date.now()}@test.com`, passwordHash: 'h' }).returning();
        userBId = userB.id;
        await db.insert(teamMembers).values({ userId: userBId, teamId: teamBId, role: 'admin' });

        // Create a work belonging to Team B
        const [workB] = await db.insert(works).values({
            tenantId: teamBId,
            code: 'WORK-B',
            name: 'Confidential Work B',
        }).returning();
        workBId = workB.id;
    });

    afterEach(async () => {
        await db.delete(works).where(eq(works.tenantId, teamBId));
        await db.delete(teamMembers).where(and(eq(teamMembers.teamId, teamAId)));
        await db.delete(teamMembers).where(and(eq(teamMembers.teamId, teamBId)));
        await db.delete(teams).where(eq(teams.id, teamAId));
        await db.delete(teams).where(eq(teams.id, teamBId));
        await db.delete(users).where(eq(users.id, userAId));
        await db.delete(users).where(eq(users.id, userBId));
        vi.resetAllMocks();
    });

    it('should prevent User A from deleting User B work', async () => {
        // Simulate User A is the one calling the action
        vi.mocked(getUser).mockResolvedValue({ id: userAId } as unknown as Awaited<ReturnType<typeof getUser>>);
        vi.mocked(getTeamForUser).mockResolvedValue({ id: teamAId } as unknown as Awaited<ReturnType<typeof getTeamForUser>>);

        const result = await deleteWork(workBId);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.message).toContain('Запись не найдена'); // Service returns "Not found" because of tenant filter
        }

        // Verify work B still exists
        const inDb = await db.select().from(works).where(eq(works.id, workBId));
        expect(inDb).toHaveLength(1);
    });

    it('should prevent User A from updating User B work', async () => {
        vi.mocked(getUser).mockResolvedValue({ id: userAId } as unknown as Awaited<ReturnType<typeof getUser>>);
        vi.mocked(getTeamForUser).mockResolvedValue({ id: teamAId } as unknown as Awaited<ReturnType<typeof getTeamForUser>>);

        await updateWork(workBId, { name: 'Hacked' });

        // In the current implementation, update might return success but update 0 rows if not found.
        // Let's see what Service does. It returns success(undefined) regardless of affected rows if no error thrown.
        // This is a "weakness" we might find.

        // Let's check DB after call
        const [work] = await db.select().from(works).where(eq(works.id, workBId));
        expect(work.name).not.toBe('Hacked');
        expect(work.name).toBe('Confidential Work B');
    });
});
