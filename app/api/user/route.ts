import { getUser } from '@/lib/db/queries';
import { getUserPermissions } from '@/lib/auth/rbac';
import { db } from '@/lib/db/drizzle';
import { users, teamMembers, rolePermissions, permissions } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * @openapi
 * /api/user:
 *   get:
 *     description: Returns the currently authenticated user with permissions
 *     responses:
 *       200:
 *         description: The authenticated user object with permissions or null
 */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json(null);
  }

  // Optimized single-roundtrip query to get user, team, and permissions
  const result = await db
    .select({
      teamId: teamMembers.teamId,
      role: teamMembers.role,
      permissionCode: permissions.code,
      accessLevel: rolePermissions.accessLevel,
      platformRole: users.platformRole,
    })
    .from(users)
    .leftJoin(teamMembers, and(eq(users.id, teamMembers.userId), isNull(teamMembers.leftAt)))
    .leftJoin(rolePermissions, eq(teamMembers.role, rolePermissions.role))
    .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(users.id, user.id));

  const teamId = result[0]?.teamId ?? null;
  // Get all permissions correctly (platform + tenant) with levels
  const userPermissions = await getUserPermissions(user.id, teamId);

  return Response.json({
    ...user,
    teamId,
    permissions: userPermissions
  });
}
