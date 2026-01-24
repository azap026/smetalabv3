import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { getUserPermissions } from '@/lib/auth/rbac';

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

  const userWithTeam = await getUserWithTeam(user.id);
  const permissions = await getUserPermissions(user.id, userWithTeam?.teamId ?? null);

  return Response.json({
    ...user,
    teamId: userWithTeam?.teamId,
    permissions
  });
}
