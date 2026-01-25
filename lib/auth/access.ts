import { getUser } from '@/lib/db/queries';
import { hasPermission } from './rbac';
import { db } from '@/lib/db/drizzle';
import { teamMembers } from '@/lib/db/schema';
import { eq, isNull, and } from 'drizzle-orm';

interface CheckAccessResult {
    authorized: boolean;
    user: Awaited<ReturnType<typeof getUser>>;
    tenantId: number | null;
}

/**
 * Server-side access check.
 * Use this in Server Components and API routes.
 */
export async function checkAccess(
    permissionCode: string,
    tenantId?: number,
    requiredLevel: 'read' | 'manage' = 'read'
): Promise<CheckAccessResult> {
    const user = await getUser();

    if (!user) {
        return { authorized: false, user: null, tenantId: null };
    }

    let resolvedTenantId = tenantId ?? null;

    // If no tenantId provided, try to get user's default team
    if (!resolvedTenantId) {
        const membership = await db
            .select()
            .from(teamMembers)
            .where(
                and(
                    eq(teamMembers.userId, user.id),
                    isNull(teamMembers.leftAt)
                )
            )
            .limit(1);

        if (membership.length > 0) {
            resolvedTenantId = membership[0].teamId;
        }
    }

    const authorized = await hasPermission(user.id, resolvedTenantId, permissionCode, requiredLevel);

    return {
        authorized,
        user,
        tenantId: resolvedTenantId,
    };
}

/**
 * Quick check if user is a platform admin (superadmin or support).
 */
export async function isPlatformAdmin(): Promise<boolean> {
    const user = await getUser();
    if (!user) return false;
    return user.platformRole === 'superadmin' || user.platformRole === 'support';
}

/**
 * Quick check if user is superadmin.
 */
export async function isSuperadmin(): Promise<boolean> {
    const user = await getUser();
    if (!user) return false;
    return user.platformRole === 'superadmin';
}

/**
 * Get user's role in a specific team.
 */
export async function getUserTeamRole(
    userId: number,
    teamId: number
): Promise<string | null> {
    const [membership] = await db
        .select()
        .from(teamMembers)
        .where(
            and(
                eq(teamMembers.userId, userId),
                eq(teamMembers.teamId, teamId),
                isNull(teamMembers.leftAt)
            )
        )
        .limit(1);

    return membership?.role ?? null;
}
