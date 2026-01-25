import { db } from '@/lib/db/drizzle';
import {
    users,
    teamMembers,
    permissions,
    rolePermissions,
    platformRolePermissions,
    impersonationSessions
} from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { cache } from 'react';

/**
 * Checks if a user has a specific permission.
 * Handles both platform-level and tenant-level scopes.
 */
export const hasPermission = cache(async function (
    userId: number,
    tenantId: number | null,
    permissionCode: string,
    requiredLevel: 'read' | 'manage' = 'read',
    ctx?: { impersonationSessionId?: string }
): Promise<boolean> {
    // 1. Fetch permission definition
    const [permission] = await db
        .select()
        .from(permissions)
        .where(eq(permissions.code, permissionCode))
        .limit(1);

    if (!permission) {
        return false;
    }

    // 2. Fetch user
    const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, userId), isNull(users.deletedAt)))
        .limit(1);

    if (!user) return false;

    // --- PLATFORM SCOPE ---
    if (permission.scope === 'platform') {
        if (!user.platformRole) return false;

        // Check if the role has this permission
        const [rolePerm] = await db
            .select()
            .from(platformRolePermissions)
            .where(
                and(
                    eq(platformRolePermissions.platformRole, user.platformRole),
                    eq(platformRolePermissions.permissionId, permission.id)
                )
            )
            .limit(1);

        if (!rolePerm) return false;

        // Level check: 'manage' > 'read'
        if (requiredLevel === 'manage' && rolePerm.accessLevel !== 'manage') return false;

        return true;
    }

    // --- TENANT SCOPE ---
    if (permission.scope === 'tenant') {
        // A. Superadmin Access (only via valid impersonation session)
        if (user.platformRole === 'superadmin') {
            if (!ctx?.impersonationSessionId) return false;

            const [session] = await db
                .select()
                .from(impersonationSessions)
                .where(
                    and(
                        eq(impersonationSessions.sessionToken, ctx.impersonationSessionId),
                        eq(impersonationSessions.superadminUserId, userId),
                        isNull(impersonationSessions.endedAt)
                    )
                )
                .limit(1);

            if (!session) return false;

            // Basic check: is this session for the requested tenant?
            if (tenantId !== null && session.targetTeamId !== tenantId) return false;

            return true; // Superadmin has all tenant permissions during impersonation
        }

        // B. Regular User Access
        if (!tenantId) return false;

        const [member] = await db
            .select()
            .from(teamMembers)
            .where(
                and(
                    eq(teamMembers.userId, userId),
                    eq(teamMembers.teamId, tenantId),
                    isNull(teamMembers.leftAt)
                )
            )
            .limit(1);

        if (!member) return false;

        // Check if the tenant role has this permission
        const [rolePerm] = await db
            .select()
            .from(rolePermissions)
            .where(
                and(
                    eq(rolePermissions.role, member.role),
                    eq(rolePermissions.permissionId, permission.id)
                )
            )
            .limit(1);

        if (!rolePerm) return false;

        // Level check: 'manage' > 'read'
        if (requiredLevel === 'manage' && rolePerm.accessLevel !== 'manage') return false;

        return true;
    }

    return false;
});

/**
 * Helper to get all permissions for a user in a specific context.
 * Useful for building the UI (menu visibility, etc).
 */
export const getUserPermissions = cache(async function (
    userId: number,
    tenantId: number | null,
    ctx?: { impersonationSessionId?: string }
): Promise<Array<{ code: string; level: 'read' | 'manage' }>> {
    // Parallelize User+PlatformPerms and Member+TenantPerms
    const userPromise = db
        .select({
            user: users,
            permCode: permissions.code,
            accessLevel: platformRolePermissions.accessLevel,
        })
        .from(users)
        .leftJoin(
            platformRolePermissions,
            eq(users.platformRole, platformRolePermissions.platformRole)
        )
        .leftJoin(
            permissions,
            eq(platformRolePermissions.permissionId, permissions.id)
        )
        .where(eq(users.id, userId));

    const memberPromise = tenantId
        ? db
              .select({
                  member: teamMembers,
                  permCode: permissions.code,
                  accessLevel: rolePermissions.accessLevel,
              })
              .from(teamMembers)
              .leftJoin(
                  rolePermissions,
                  eq(teamMembers.role, rolePermissions.role)
              )
              .leftJoin(
                  permissions,
                  eq(rolePermissions.permissionId, permissions.id)
              )
              .where(
                  and(
                      eq(teamMembers.userId, userId),
                      eq(teamMembers.teamId, tenantId),
                      isNull(teamMembers.leftAt)
                  )
              )
        : Promise.resolve([]);

    const [userRows, memberRows] = await Promise.all([
        userPromise,
        memberPromise,
    ]);

    if (userRows.length === 0) return [];
    const user = userRows[0].user; // All rows have same user info

    const permsMap = new Map<string, 'read' | 'manage'>();

    // 1. Process Platform Permissions
    for (const row of userRows) {
        if (row.permCode && row.accessLevel) {
            permsMap.set(row.permCode, row.accessLevel as 'read' | 'manage');
        }
    }

    // 2. Process Tenant Permissions
    if (user.platformRole === 'superadmin' && ctx?.impersonationSessionId) {
        // Superadmin in impersonation sees all tenant permissions with 'manage' level
        const tenantPerms = await db
            .select({ code: permissions.code })
            .from(permissions)
            .where(eq(permissions.scope, 'tenant'));

        for (const p of tenantPerms) {
            permsMap.set(p.code, 'manage');
        }
    } else if (tenantId && memberRows.length > 0) {
        for (const row of memberRows) {
            if (row.permCode && row.accessLevel) {
                // If a permission exists from multiple sources, choose highest level
                const existing = permsMap.get(row.permCode);
                const level = row.accessLevel as 'read' | 'manage';
                if (!existing || level === 'manage') {
                    permsMap.set(row.permCode, level);
                }
            }
        }
    }

    return Array.from(permsMap.entries()).map(([code, level]) => ({
        code,
        level,
    }));
});
