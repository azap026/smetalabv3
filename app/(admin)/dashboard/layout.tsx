import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin-sidebar';
import { UserMenu } from '@/components/user-menu';
import { getUser } from '@/lib/db/queries';
import { UserProvider } from '@/components/permissions-provider';
import { getUserPermissions } from '@/lib/auth/rbac';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const userData = user ? { name: user.name, email: user.email } : null;
  const permissionsInfo = user ? await getUserPermissions(user, null) : [];

  return (
    <UserProvider permissions={permissionsInfo} user={user}>
      <SidebarProvider>
        <AdminSidebar user={userData} />
        <SidebarInset>
          <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <div className="flex-1">
              <span className="font-semibold text-lg">Admin Dashboard</span>
            </div>
            <div>
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </UserProvider>
  );
}
