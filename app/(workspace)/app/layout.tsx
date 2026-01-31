import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { getUserPermissions } from '@/lib/auth/rbac';
import { UserProvider } from '@/components/permissions-provider';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const user = await getUser();
    const team = await getTeamForUser();

    // Convert to simple PermissionEntry array
    const permissionsInfo = user ? await getUserPermissions(user, team?.id || null) : [];

    return (
        <UserProvider permissions={permissionsInfo} user={user}>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <AppHeader />
                    <main className="flex-1 p-4 md:p-6 lg:p-8">
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </UserProvider>
    );
}
