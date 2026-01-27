import { desc, and, eq, isNull, or, sql } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, teamMembers, teams, users, works } from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import { cache } from 'react';
import { WorkRow } from '@/types/work-row';

export const getUser = cache(async () => {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
});

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date()
    })
    .where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}



export async function getActivityLogs(userId?: number) {
  let targetUserId = userId;

  if (!targetUserId) {
    const user = await getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    targetUserId = user.id;
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, targetUserId))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getTeamForUser() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
    with: {
      team: {
        with: {
          teamMembers: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  return result?.team || null;
}

export async function getWorks() {
  const team = await getTeamForUser();
  const teamId = team?.id;

  return await db
    .select({
      id: works.id,
      tenantId: works.tenantId,
      code: works.code,
      name: works.name,
      unit: works.unit,
      price: works.price,
      phase: works.phase,
      category: works.category,
      subcategory: works.subcategory,
      shortDescription: works.shortDescription,
      description: works.description,
      status: works.status,
      metadata: works.metadata,
      tags: works.tags,
      createdAt: works.createdAt,
      updatedAt: works.updatedAt,
      deletedAt: works.deletedAt,
    })
    .from(works)
    .where(
      and(
        isNull(works.deletedAt),
        teamId
          ? or(isNull(works.tenantId), eq(works.tenantId, teamId))
          : isNull(works.tenantId)
      )
    )
    .orderBy(sql`string_to_array(${works.code}, '.')::bigint[]`) as unknown as WorkRow[];
}
