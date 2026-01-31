
import { checkAccess } from '@/lib/auth/access';
import { redirect } from 'next/navigation';
import TeamPageClient from './client-page';

export default async function TeamPage() {
    const { authorized } = await checkAccess('team', undefined, 'read');

    if (!authorized) {
        redirect('/app');
    }

    return <TeamPageClient />;
}
