'use client';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
    LayoutDashboard,
    Users,
    Settings,
    Activity,
    Shield,
    Key,
    LogOut,
    User as UserIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@/lib/db/schema';

const adminNavItems = [
    {
        title: 'Обзор',
        url: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Тенанты',
        url: '/dashboard/tenants',
        icon: Users,
    },
    {
        title: 'Разрешения',
        url: '/dashboard/permissions',
        icon: Key,
    },
    {
        title: 'Общие',
        url: '/dashboard/general',
        icon: Settings,
    },
    {
        title: 'Активность',
        url: '/dashboard/activity',
        icon: Activity,
    },
    {
        title: 'Безопасность',
        url: '/dashboard/security',
        icon: Shield,
    },
];

export function AdminSidebar({ user }: { user: Pick<User, 'name' | 'email'> | null }) {
    const pathname = usePathname();

    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2 px-2 py-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white font-bold">
                        A
                    </div>
                    <span className="text-lg font-semibold">Admin Panel</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Управление</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {adminNavItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.url || pathname.startsWith(item.url + '/')}
                                    >
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                <UserIcon className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">
                                    {user?.name || 'Admin'}
                                </span>
                                <span className="truncate text-xs">
                                    {user?.email || ''}
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/">
                                <LogOut />
                                <span>Back to App</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
