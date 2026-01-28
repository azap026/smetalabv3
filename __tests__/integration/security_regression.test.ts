import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db/drizzle';
import { users, teams, permissions, type NewUser, type NewTeam } from '@/lib/db/schema';
import { hasPermission } from '@/lib/auth/rbac';
import { sql, eq } from 'drizzle-orm';

const permCode = 'test.perm.7777';

describe('RBAC Security Regression', () => {
    let testAdminId: number;
    let testTeamId: number;

    beforeEach(async () => {
        // setup
        const [user] = await db.insert(users).values({
            name: 'Super Admin',
            email: `super-${Date.now()}@test.com`,
            platformRole: 'superadmin',
            passwordHash: 'hash'
        }).returning();
        testAdminId = user.id;

        const [team] = await db.insert(teams).values({
            name: `Test Team ${Date.now()}`
        }).returning();
        testTeamId = team.id;

        await db.insert(permissions).values({ code: permCode, name: 'P', scope: 'tenant' }).onConflictDoNothing();
    });

    afterEach(async () => {
        await db.delete(permissions).where(eq(permissions.code, permCode));
        if (testTeamId) await db.delete(teams).where(eq(teams.id, testTeamId));
        if (testAdminId) await db.delete(users).where(eq(users.id, testAdminId));
    });

    it('should NOT grant access to superadmin with INVALID impersonation session', async () => {
        const authorized = await hasPermission(
            testAdminId,
            testTeamId,
            permCode,
            'read',
            { impersonationSessionId: 'invalid-token' }
        );
        expect(authorized).toBe(false);
    });
});
