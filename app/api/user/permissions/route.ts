import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getUserPermissions } from '@/lib/auth/rbac';
import { db } from '@/lib/db/drizzle';
import { teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
    try {
        const user = await getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const tenantIdStr = searchParams.get('tenantId');

        let tenantId: number | null = null;

        if (tenantIdStr) {
            tenantId = parseInt(tenantIdStr, 10);
        } else {
            // Get user's first active team as default
            const membership = await db
                .select()
                .from(teamMembers)
                .where(eq(teamMembers.userId, user.id))
                .then(rows => rows.find(r => r.leftAt === null));

            if (membership) {
                tenantId = membership.teamId;
            }
        }

        const permissions = await getUserPermissions(user, tenantId);

        return NextResponse.json({
            permissions,
            userId: user.id,
            tenantId,
        });
    } catch (error) {
        console.error('Error fetching user permissions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
