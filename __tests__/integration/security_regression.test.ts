
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db/drizzle';
import { users, teams, permissions, impersonationSessions } from '@/lib/db/schema';
import { hasPermission } from '@/lib/auth/rbac';
import { eq as drizzleEq } from 'drizzle-orm';

const permCode = 'test.perm.7777';

describe('RBAC Security Regression', () => {
    let testAdminId: number;
    let testTeamId: number;
    const sessionToken = 'valid-impersonation-token';

    beforeEach(async () => {
        // 1. Setup Superadmin
        const [user] = await db.insert(users).values({
            name: 'Super Admin',
            email: `super-${Date.now()}@test.com`,
            platformRole: 'superadmin',
            passwordHash: 'hash'
        }).returning();
        testAdminId = user.id;

        // 2. Setup Target Team
        const [team] = await db.insert(teams).values({
            name: `Test Team ${Date.now()}`
        }).returning();
        testTeamId = team.id;

        // 3. Setup Permission
        await db.insert(permissions).values({
            code: permCode,
            name: 'P',
            scope: 'tenant'
        }).onConflictDoNothing();
    });

    afterEach(async () => {
        await db.delete(impersonationSessions).where(drizzleEq(impersonationSessions.superadminUserId, testAdminId));
        await db.delete(permissions).where(drizzleEq(permissions.code, permCode));
        if (testTeamId) await db.delete(teams).where(drizzleEq(teams.id, testTeamId));
        if (testAdminId) await db.delete(users).where(drizzleEq(users.id, testAdminId));
    });

    it('should_deny_access_to_superadmin_with_INVALID_impersonation_session', async () => {
        const authorized = await hasPermission(
            testAdminId,
            testTeamId,
            permCode,
            'read',
            { impersonationSessionId: 'invalid-token' }
        );
        expect(authorized).toBe(false);
    });

    it('should_grant_access_to_superadmin_with_VALID_impersonation_session', async () => {
        // Create valid session
        await db.insert(impersonationSessions).values({
            superadminUserId: testAdminId,
            targetTeamId: testTeamId,
            sessionToken: sessionToken,
            startedAt: new Date(),
        });

        const authorized = await hasPermission(
            testAdminId,
            testTeamId,
            permCode,
            'manage',
            { impersonationSessionId: sessionToken }
        );

        expect(authorized).toBe(true);
    });

    it('should_deny_access_to_regular_user_attempting_impersonation', async () => {
        const [regularUser] = await db.insert(users).values({
            name: 'Regular',
            email: `reg-${Date.now()}@test.com`,
            passwordHash: 'hash'
        }).returning();

        try {
            const authorized = await hasPermission(
                regularUser.id,
                testTeamId,
                permCode,
                'read',
                { impersonationSessionId: 'some-token' }
            );
            expect(authorized).toBe(false);
        } finally {
            await db.delete(users).where(drizzleEq(users.id, regularUser.id));
        }
    });
});
