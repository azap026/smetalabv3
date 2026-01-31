
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getTeamForUser, getTeamWithMembers } from '@/lib/db/queries';

// Mock cookies
vi.mock('next/headers', () => ({
    cookies: () => ({
        get: (name: string) => {
            if (name === 'session') return { value: 'valid-token' };
            return null;
        }
    })
}));

// Mock verifyToken
vi.mock('@/lib/auth/session', () => ({
    verifyToken: async () => ({
        user: { id: 999999 }, // Will be updated in beforeEach
        expires: new Date(Date.now() + 1000000)
    })
}));

// Mock cache from react (since we are in test environment)
vi.mock('react', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as object),
        cache: (fn: any) => fn, // Passthrough
    };
});

describe('Team Queries Optimization', () => {
    let testUserId: number;
    let testTeamId: number;

    beforeEach(async () => {
        // Create user
        const [user] = await db.insert(users).values({
            name: 'Opt User',
            email: `opt-${Date.now()}@test.com`,
            passwordHash: 'hash',
        }).returning();
        testUserId = user.id;

        // Update verifyToken mock to return this user
        const sessionMock = await import('@/lib/auth/session');
        // @ts-ignore
        sessionMock.verifyToken = async () => ({
            user: { id: testUserId },
            expires: new Date(Date.now() + 1000000)
        });

        // Create team
        const [team] = await db.insert(teams).values({
            name: 'Opt Team'
        }).returning();
        testTeamId = team.id;

        // Add member
        await db.insert(teamMembers).values({ userId: testUserId, teamId: testTeamId, role: 'admin' });
    });

    afterEach(async () => {
        if (testTeamId) {
            await db.delete(teamMembers).where(eq(teamMembers.teamId, testTeamId));
            await db.delete(teams).where(eq(teams.id, testTeamId));
        }
        if (testUserId) {
            await db.delete(users).where(eq(users.id, testUserId));
        }
    });

    it('getTeamForUser should return light object (without members)', async () => {
        const team = await getTeamForUser();
        expect(team).not.toBeNull();
        expect(team?.id).toBe(testTeamId);
        expect(team?.name).toBe('Opt Team');

        // It should NOT have teamMembers property populated as an array of objects with user info
        // Note: In Drizzle, if 'with' is not used, the property is usually missing or undefined.
        // But if I cast it to any, I can check.
        const teamAny = team as any;
        expect(teamAny.teamMembers).toBeUndefined();
    });

    it('getTeamWithMembers should return object WITH members', async () => {
        const team = await getTeamWithMembers();
        expect(team).not.toBeNull();
        expect(team?.id).toBe(testTeamId);
        expect(team?.teamMembers).toBeDefined();
        expect(team?.teamMembers.length).toBeGreaterThan(0);
        expect(team?.teamMembers[0].user).toBeDefined();
        expect(team?.teamMembers[0].user.id).toBe(testUserId);
    });
});
