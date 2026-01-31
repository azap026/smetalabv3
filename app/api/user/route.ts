import { getUser } from '@/lib/db/queries';
import { getUserPermissions } from '@/lib/auth/rbac';
import { db } from '@/lib/db/drizzle';
import { teamMembers } from '@/lib/db/schema';
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

  // Optimized: Just get the team ID. Permissions are fetched by getUserPermissions.
  const teamMember = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.userId, user.id), isNull(teamMembers.leftAt)),
    columns: { teamId: true },
  });

  const teamId = teamMember?.teamId ?? null;
  // Get all permissions correctly (platform + tenant) with levels
  const userPermissions = await getUserPermissions(user, teamId);

  return Response.json({
    ...user,
    teamId,
    permissions: userPermissions
  });
}
