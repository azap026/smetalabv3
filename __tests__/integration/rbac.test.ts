/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers, permissions, rolePermissions } from '@/lib/db/schema';
import { hasPermission } from '@/lib/auth/rbac';
import { sql } from 'drizzle-orm';

// --- Test Data ---
const testUser = { id: 9999, name: 'Test User', email: 'integration-test@test.com', platformRole: null, passwordHash: 'hash' } as any;
const testAdmin = { id: 9998, name: 'Admin User', email: 'integration-admin@test.com', platformRole: null, passwordHash: 'hash' } as any;
const testTeam = { id: 9999, name: 'Test Team' } as any;
const testPermissionCode = 'integration.test.permission';

describe('RBAC Integration Tests', () => {

    beforeEach(async () => {
        // 1. Surgical Cleanup
        await db.execute(sql`DELETE FROM team_members WHERE team_id = 9999 OR user_id IN (9999, 9998)`);
        await db.execute(sql`DELETE FROM users WHERE id IN (9999, 9998)`);
        await db.execute(sql`DELETE FROM role_permissions WHERE permission_id IN (SELECT id FROM permissions WHERE code = ${testPermissionCode})`);
        await db.execute(sql`DELETE FROM permissions WHERE code = ${testPermissionCode}`);
        await db.execute(sql`DELETE FROM teams WHERE id = 9999`);

        // 2. Setup Test Permission
        const [perm] = await db.insert(permissions).values({
            name: 'Integration Test Permission',
            code: testPermissionCode,
            scope: 'tenant'
        }).returning();

        // 3. Setup Role Mapping for this permission
        await db.insert(rolePermissions).values({
            role: 'admin',
            permissionId: perm.id,
            accessLevel: 'manage'
        });

        // 4. Setup Test Users and Team
        await db.insert(users).values([testUser, testAdmin]);
        await db.insert(teams).values(testTeam);
        await db.insert(teamMembers).values({ userId: testAdmin.id, teamId: testTeam.id, role: 'admin' });
    });

    // --- Tests ---
    it('should grant permission if user has the correct role in the team', async () => {
        const authorized = await hasPermission(testAdmin.id, testTeam.id, testPermissionCode);
        expect(authorized).toBe(true);
    });

    it('should deny permission if user is not in the team', async () => {
        const authorized = await hasPermission(testUser.id, testTeam.id, testPermissionCode);
        expect(authorized).toBe(false);
    });

    it('should deny permission if the role does not have the permission', async () => {
        // Add member with role 'estimator' who doesn't have the permission
        await db.insert(teamMembers).values({ userId: testUser.id, teamId: testTeam.id, role: 'estimator' });
        const authorized = await hasPermission(testUser.id, testTeam.id, testPermissionCode);
        expect(authorized).toBe(false);
    });

    it('should deny permission for a non-existent team', async () => {
        const authorized = await hasPermission(testAdmin.id, 8888, testPermissionCode);
        expect(authorized).toBe(false);
    });

    it('should deny permission for a non-existent user', async () => {
        const authorized = await hasPermission(8888, testTeam.id, testPermissionCode);
        expect(authorized).toBe(false);
    });

    it('should return false for a non-existent permission', async () => {
        const authorized = await hasPermission(testAdmin.id, testTeam.id, 'non.existent.permission');
        expect(authorized).toBe(false);
    });
});
