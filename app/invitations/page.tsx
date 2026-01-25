import { redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { invitations, teamMembers, activityLogs, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export default async function InvitationPage({
    searchParams,
}: {
    searchParams: { inviteId?: string };
}) {
    const { inviteId } = await searchParams;
    const user = await getUser();

    if (!inviteId) {
        redirect('/');
    }

    // Check if invitation exists and who it's for
    const [invitation] = await db
        .select()
        .from(invitations)
        .where(
            and(
                eq(invitations.id, parseInt(inviteId)),
                eq(invitations.status, 'pending')
            )
        )
        .limit(1);

    if (!invitation) {
        redirect('/app?error=invalid_invitation');
    }

    if (user) {
        // If logged in and emails match, accept it
        if (user.email === invitation.email) {
            // Check if already a member
            const existingMember = await db
                .select()
                .from(teamMembers)
                .where(
                    and(
                        eq(teamMembers.userId, user.id),
                        eq(teamMembers.teamId, invitation.teamId)
                    )
                )
                .limit(1);

            if (existingMember.length === 0) {
                await db.insert(teamMembers).values({
                    userId: user.id,
                    teamId: invitation.teamId,
                    role: invitation.role,
                });

                // Log activity
                await db.insert(activityLogs).values({
                    teamId: invitation.teamId,
                    userId: user.id,
                    action: 'ACCEPT_INVITATION',
                });
            }

            await db
                .update(invitations)
                .set({ status: 'accepted' })
                .where(eq(invitations.id, invitation.id));

            redirect('/app');
        } else {
            // Logged in as wrong user
            redirect('/app?error=email_mismatch');
        }
    }

    // Not logged in. Check if a user with this email already exists in our system.
    const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, invitation.email))
        .limit(1);

    if (existingUser) {
        // User exists! Send them to sign-in
        redirect(`/sign-in?inviteId=${inviteId}&email=${encodeURIComponent(invitation.email)}`);
    } else {
        // New user! Send them to sign-up
        redirect(`/sign-up?inviteId=${inviteId}&email=${encodeURIComponent(invitation.email)}`);
    }
}

