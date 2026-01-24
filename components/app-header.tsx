'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { usePageTitle } from '@/hooks/use-page-title';
import { NotificationBell } from '@/components/notification-bell';
import { UserMenu } from '@/components/user-menu';

export function AppHeader() {
    const pageTitle = usePageTitle();

    return (
        <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger className="-ml-2" />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex-1">
                <h1 className="text-lg font-semibold">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-2">
                <NotificationBell />
                <UserMenu />
            </div>
        </header>
    );
}
