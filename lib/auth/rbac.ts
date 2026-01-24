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

/**
 * Checks if a user has a specific permission.
 * Handles both platform-level and tenant-level scopes.
 */
export async function hasPermission(
    userId: number,
    tenantId: number | null,
    permissionCode: string,
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

        return !!rolePerm;
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

        return !!rolePerm;
    }

    return false;
}

/**
 * Helper to get all permissions for a user in a specific context.
 * Useful for building the UI (menu visibility, etc).
 */
export async function getUserPermissions(
    userId: number,
    tenantId: number | null,
    ctx?: { impersonationSessionId?: string }
): Promise<string[]> {
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!user) return [];

    const perms: string[] = [];

    // 1. Get Platform Permissions
    if (user.platformRole) {
        const platformPerms = await db
            .select({ code: permissions.code })
            .from(platformRolePermissions)
            .innerJoin(permissions, eq(platformRolePermissions.permissionId, permissions.id))
            .where(eq(platformRolePermissions.platformRole, user.platformRole));

        perms.push(...platformPerms.map(p => p.code));
    }

    // 2. Get Tenant Permissions
    if (user.platformRole === 'superadmin' && ctx?.impersonationSessionId) {
        // Superadmin in impersonation sees all tenant permissions
        const tenantPerms = await db
            .select({ code: permissions.code })
            .from(permissions)
            .where(eq(permissions.scope, 'tenant'));

        perms.push(...tenantPerms.map(p => p.code));
    } else if (tenantId) {
        const [member] = await db
            .select()
            .from(teamMembers)
            .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, tenantId), isNull(teamMembers.leftAt)))
            .limit(1);

        if (member) {
            const tenantPerms = await db
                .select({ code: permissions.code })
                .from(rolePermissions)
                .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
                .where(eq(rolePermissions.role, member.role));

            perms.push(...tenantPerms.map(p => p.code));
        }
    }

    return [...new Set(perms)];
}
