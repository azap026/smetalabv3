import { getTeamWithMembers } from '@/lib/db/queries';

export async function GET() {
  const team = await getTeamWithMembers();
  return Response.json(team);
}
