import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers, permissions, rolePermissions, platformRolePermissions, activityLogs, invitations, estimateShares, impersonationSessions } from '@/lib/db/schema';
import { hasPermission } from '@/lib/auth/rbac';
import { sql } from 'drizzle-orm';

// --- Test Data ---
const testUser = { id: 1, name: 'Test User', email: 'test@test.com', platformRole: null, passwordHash: 'hash' };
const testAdmin = { id: 2, name: 'Admin User', email: 'admin@test.com', platformRole: null, passwordHash: 'hash' };
const testTeam = { id: 101, name: 'Test Team' };
const testPermission = { id: 1, name: 'Create Estimates', code: 'estimates.create', scope: 'tenant', description: 'Create estimates' };
const testRolePermission = { role: 'admin', permissionId: 1, accessLevel: 'manage' };

describe('RBAC Integration Tests', () => {

    // --- Setup and Teardown ---
    beforeAll(async () => {
        // Run migrations on the test database before starting
        // In a real project, you would point this to a separate test DB
        // For this example, we'll assume the schema is already in place
        // and we'll just clean up after ourselves.
    });

    beforeEach(async () => {
        // Clean all relevant tables before each test in the correct order
        await db.delete(impersonationSessions);
        await db.delete(estimateShares);
        await db.delete(invitations);
        await db.delete(activityLogs);
        await db.delete(teamMembers);
        await db.delete(users);
        await db.delete(teams);
        await db.delete(platformRolePermissions);
        await db.delete(rolePermissions);
        await db.delete(permissions);


        // Seed necessary data for the tests
        await db.insert(users).values([testUser, testAdmin]);
        await db.insert(teams).values(testTeam);
        await db.insert(permissions).values(testPermission);
        await db.insert(rolePermissions).values(testRolePermission);
        await db.insert(teamMembers).values({ userId: testAdmin.id, teamId: testTeam.id, role: 'admin' });
    });

    afterAll(async () => {
        // Final cleanup
        await db.delete(impersonationSessions);
        await db.delete(estimateShares);
        await db.delete(invitations);
        await db.delete(activityLogs);
        await db.delete(teamMembers);
        await db.delete(users);
        await db.delete(teams);
        await db.delete(platformRolePermissions);
        await db.delete(rolePermissions);
        await db.delete(permissions);
        // Reset sequences if necessary (example for PostgreSQL)
        await db.execute(sql`ALTER SEQUENCE users_id_seq RESTART WITH 1;`);
        await db.execute(sql`ALTER SEQUENCE teams_id_seq RESTART WITH 1;`);
        await db.execute(sql`ALTER SEQUENCE permissions_id_seq RESTART WITH 1;`);
    });

    // --- Tests ---
    it('should grant permission if user has the correct role in the team', async () => {
        const authorized = await hasPermission(testAdmin.id, testTeam.id, 'estimates.create');
        expect(authorized).toBe(true);
    });

    it('should deny permission if user is not in the team', async () => {
        const authorized = await hasPermission(testUser.id, testTeam.id, 'estimates.create');
        expect(authorized).toBe(false);
    });

    it('should deny permission if the role does not have the permission', async () => {
        // Give the user an 'estimator' role, which doesn't have the perm yet
        await db.insert(teamMembers).values({ userId: testUser.id, teamId: testTeam.id, role: 'estimator' });
        const authorized = await hasPermission(testUser.id, testTeam.id, 'estimates.create');
        expect(authorized).toBe(false);
    });

    it('should return false for a non-existent permission', async () => {
        const authorized = await hasPermission(testAdmin.id, testTeam.id, 'non.existent.permission');
        expect(authorized).toBe(false);
    });
});
