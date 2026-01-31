
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers, permissions, rolePermissions, platformRolePermissions, type User, type Team } from '@/lib/db/schema';
import { hasPermission } from '@/lib/auth/rbac';
import { eq, and } from 'drizzle-orm';

describe('RBAC Integration Tests', () => {
    let testUser: User;
    let testAdmin: User;
    let testTeam: Team;
    let testPermId: number;
    const testPermissionCode = `integration.test.perm.${Date.now()}`;

    beforeEach(async () => {
        // 1. Setup Test Permission
        const [perm] = await db.insert(permissions).values({
            name: 'Integration Test Permission',
            code: testPermissionCode,
            scope: 'tenant'
        }).returning();
        testPermId = perm.id;

        // 2. Setup Role Mapping (Admin role gets this permission)
        await db.insert(rolePermissions).values({
            role: 'admin',
            permissionId: testPermId,
            accessLevel: 'manage'
        });

        // 3. Setup Test Team
        const [team] = await db.insert(teams).values({
            name: 'Integration Test Team'
        }).returning();
        testTeam = team;

        // 4. Setup Test Users
        const [user] = await db.insert(users).values({
            name: 'Regular User',
            email: `user-${Date.now()}@test.com`,
            passwordHash: 'hash'
        }).returning();
        testUser = user;

        const [admin] = await db.insert(users).values({
            name: 'Admin User',
            email: `admin-${Date.now()}@test.com`,
            passwordHash: 'hash'
        }).returning();
        testAdmin = admin;

        // 5. Setup Membership
        await db.insert(teamMembers).values({
            userId: testAdmin.id,
            teamId: testTeam.id,
            role: 'admin'
        });
    });

    afterEach(async () => {
        // Cleanup in reverse order
        await db.delete(teamMembers).where(eq(teamMembers.teamId, testTeam.id));
        await db.delete(rolePermissions).where(eq(rolePermissions.permissionId, testPermId));
        await db.delete(permissions).where(eq(permissions.id, testPermId));
        await db.delete(teams).where(eq(teams.id, testTeam.id));
        await db.delete(users).where(and(eq(users.id, testUser.id)));
        await db.delete(users).where(and(eq(users.id, testAdmin.id)));
    });

    it('should_grant_permission_when_user_has_correct_role_in_team', async () => {
        const authorized = await hasPermission(testAdmin.id, testTeam.id, testPermissionCode);
        expect(authorized).toBe(true);
    });

    it('should_deny_permission_when_user_is_not_part_of_the_team', async () => {
        const authorized = await hasPermission(testUser.id, testTeam.id, testPermissionCode);
        expect(authorized).toBe(false);
    });

    it('should_deny_permission_when_role_lacks_the_permission', async () => {
        // Add user as 'estimator' (who doesn't have the permission mapped in rolePermissions)
        await db.insert(teamMembers).values({
            userId: testUser.id,
            teamId: testTeam.id,
            role: 'estimator'
        });

        const authorized = await hasPermission(testUser.id, testTeam.id, testPermissionCode);
        expect(authorized).toBe(false);
    });

    it('should_grant_platform_permission_to_superadmin_regardless_of_team', async () => {
        // 1. Setup Platform Permission
        const platPermCode = `plat.test.${Date.now()}`;
        const [perm] = await db.insert(permissions).values({
            name: 'Plat Perm',
            code: platPermCode,
            scope: 'platform'
        }).returning();

        await db.insert(platformRolePermissions).values({
            platformRole: 'superadmin',
            permissionId: perm.id,
            accessLevel: 'manage'
        });

        // 2. Setup Superadmin User
        const [superUser] = await db.insert(users).values({
            name: 'Super',
            email: `super-${Date.now()}@test.com`,
            passwordHash: 'hash',
            platformRole: 'superadmin'
        }).returning();

        try {
            const authorized = await hasPermission(superUser.id, null, platPermCode);
            expect(authorized).toBe(true);
        } finally {
            // Cleanup
            await db.delete(platformRolePermissions).where(eq(platformRolePermissions.permissionId, perm.id));
            await db.delete(permissions).where(eq(permissions.id, perm.id));
            await db.delete(users).where(eq(users.id, superUser.id));
        }
    });

    it('should_deny_access_for_non_existent_entities', async () => {
        expect(await hasPermission(999999, testTeam.id, testPermissionCode)).toBe(false);
        expect(await hasPermission(testAdmin.id, 999999, testPermissionCode)).toBe(false);
        expect(await hasPermission(testAdmin.id, testTeam.id, 'invalid.code')).toBe(false);
    });
});
