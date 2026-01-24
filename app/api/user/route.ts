import { getUser } from '@/lib/db/queries';

/**
 * @openapi
 * /api/user:
 *   get:
 *     description: Returns the currently authenticated user
 *     responses:
 *       200:
 *         description: The authenticated user object or null
 */
export async function GET() {
  const user = await getUser();
  return Response.json(user);
}
