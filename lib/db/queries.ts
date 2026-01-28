import { desc, and, eq, isNull, or } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, teamMembers, teams, users, works, materials } from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { WorkRow } from '@/types/work-row';
import { MaterialRow } from '@/types/material-row';

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

export const getTeamForUser = cache(async () => {
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
});

export async function getWorks() {
  const team = await getTeamForUser();
  const teamId = team?.id;

  return unstable_cache(
    async () => {
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
        .orderBy(works.sortOrder) as unknown as WorkRow[];
    },
    [`works-team-${teamId || 'public'}`],
    {
      tags: ['works', teamId ? `works-team-${teamId}` : 'works-public'],
      revalidate: 3600,
    }
  )();
}

import { ilike } from 'drizzle-orm';

export async function getMaterials(limit?: number, search?: string) {
  const team = await getTeamForUser();
  const teamId = team?.id;

  const filters = [isNull(materials.deletedAt)];

  if (teamId) {
    filters.push(or(isNull(materials.tenantId), eq(materials.tenantId, teamId))!);
  } else {
    filters.push(isNull(materials.tenantId));
  }

  if (search) {
    filters.push(ilike(materials.name, `%${search}%`));
  }

  let query = db
    .select({
      id: materials.id,
      tenantId: materials.tenantId,
      code: materials.code,
      name: materials.name,
      unit: materials.unit,
      price: materials.price,
      vendor: materials.vendor,
      weight: materials.weight,
      categoryLv1: materials.categoryLv1,
      categoryLv2: materials.categoryLv2,
      categoryLv3: materials.categoryLv3,
      categoryLv4: materials.categoryLv4,
      productUrl: materials.productUrl,
      imageUrl: materials.imageUrl,
      description: materials.description,
      status: materials.status,
      metadata: materials.metadata,
      tags: materials.tags,
      createdAt: materials.createdAt,
      updatedAt: materials.updatedAt,
      deletedAt: materials.deletedAt,
    })
    .from(materials)
    .where(and(...filters))
    .orderBy(materials.code);

  const finalLimit = limit || (search ? 500 : 1000);
  if (finalLimit) {
    // @ts-expect-error - constructing query dynamically
    query = query.limit(finalLimit);
  }

  return await query as unknown as MaterialRow[];
}

