import { db } from './drizzle';
import { teams, teamMembers, users } from './schema';
import { desc, sql } from 'drizzle-orm';

export async function getAllTeams() {
    return await db
        .select({
            id: teams.id,
            name: teams.name,
            planName: teams.planName,
            subscriptionStatus: teams.subscriptionStatus,
            createdAt: teams.createdAt,
            memberCount: sql<number>`count(${teamMembers.id})`.mapWith(Number),
        })
        .from(teams)
        .leftJoin(teamMembers, sql`${teams.id} = ${teamMembers.teamId}`)
        .groupBy(teams.id)
        .orderBy(desc(teams.createdAt));
}
