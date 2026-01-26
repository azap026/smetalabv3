import { db } from '@/lib/db/drizzle';
import {
    users,
    teamMembers,
    permissions,
    rolePermissions,
    platformRolePermissions,
    impersonationSessions,
    type User
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
        // A. Superadmin Access (via valid impersonation session)
        if (user.platformRole === 'superadmin' && ctx?.impersonationSessionId) {
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

            if (session) {
                // Basic check: is this session for the requested tenant?
                if (tenantId === null || session.targetTeamId === tenantId) {
                    return true;
                }
            }
        }

        // B. Regular User Access (also applies to superadmins without active impersonation)
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
    userIdOrUser: number | User,
    tenantId: number | null,
    ctx?: { impersonationSessionId?: string }
): Promise<Array<{ code: string; level: 'read' | 'manage' }>> {
    let user: User | undefined;

    if (typeof userIdOrUser === 'number') {
        const [u] = await db
            .select()
            .from(users)
            .where(eq(users.id, userIdOrUser))
            .limit(1);
        user = u;
    } else {
        user = userIdOrUser;
    }

    if (!user) return [];

    const userId = user.id;
    const permsMap = new Map<string, 'read' | 'manage'>();

    // 1. Get Platform Permissions
    if (user.platformRole) {
        const platformPerms = await db
            .select({
                code: permissions.code,
                level: platformRolePermissions.accessLevel
            })
            .from(platformRolePermissions)
            .innerJoin(permissions, eq(platformRolePermissions.permissionId, permissions.id))
            .where(eq(platformRolePermissions.platformRole, user.platformRole));

        for (const p of platformPerms) {
            permsMap.set(p.code, p.level as 'read' | 'manage');
        }
    }

    // 2. Get Tenant Permissions
    if (user.platformRole === 'superadmin' && ctx?.impersonationSessionId) {
        // Superadmin in impersonation sees all tenant permissions with 'manage' level
        const tenantPerms = await db
            .select({ code: permissions.code })
            .from(permissions)
            .where(eq(permissions.scope, 'tenant'));

        for (const p of tenantPerms) {
            permsMap.set(p.code, 'manage');
        }
    } else if (tenantId) {
        const [member] = await db
            .select()
            .from(teamMembers)
            .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, tenantId), isNull(teamMembers.leftAt)))
            .limit(1);

        if (member) {
            const tenantPerms = await db
                .select({
                    code: permissions.code,
                    level: rolePermissions.accessLevel
                })
                .from(rolePermissions)
                .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
                .where(eq(rolePermissions.role, member.role));

            for (const p of tenantPerms) {
                // If a permission exists from multiple sources, choose highest level
                const existing = permsMap.get(p.code);
                if (!existing || p.level === 'manage') {
                    permsMap.set(p.code, p.level as 'read' | 'manage');
                }
            }
        }
    }

    return Array.from(permsMap.entries()).map(([code, level]) => ({ code, level }));
});
