import { db } from '@/lib/db/drizzle';
import { notifications } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id } = await params;
  const notificationId = parseInt(id);

  if (isNaN(notificationId)) {
    return new Response('Invalid ID', { status: 400 });
  }

  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, user.id)
      )
    );

  return new Response('OK', { status: 200 });
}
