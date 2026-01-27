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
    FolderKanban,
    Home,
    ShoppingCart,
    Layers,
    Wrench,
    Package,
    Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/use-permissions';

const mainNavItems = [
    {
        title: 'Главная',
        url: '/app',
        icon: Home,
    },
    {
        title: 'Проекты',
        url: '/app/projects',
        icon: FolderKanban,
        requiredPermission: 'projects',
    },
    {
        title: 'Закупки',
        url: '/app/global-purchases',
        icon: ShoppingCart,
    },
    {
        title: 'Шаблоны',
        url: '/app/patterns',
        icon: Layers,
    },
    {
        title: 'Команда',
        url: '/app/team',
        icon: Users,
        requiredPermission: 'team',
    },
];

const guideNavItems = [
    {
        title: 'Работы',
        url: '/app/guide/works',
        icon: Wrench,
        requiredPermission: 'guide',
    },
    {
        title: 'Материалы',
        url: '/app/guide/materials',
        icon: Package,
        requiredPermission: 'guide',
    },
    {
        title: 'Контрагенты',
        url: '/app/guide/counterparties',
        icon: Users,
        requiredPermission: 'guide',
    },
];

export function AppSidebar() {
    const pathname = usePathname();
    const { hasPermission, loading } = usePermissions();

    if (loading) {
        return (
            <Sidebar>
                <SidebarHeader>
                    <div className="flex items-center gap-2 px-2 py-4">
                        <div className="h-8 w-8 rounded-lg bg-orange-200 animate-pulse" />
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <div className="px-4 py-6 space-y-6">
                        <div className="space-y-2">
                            <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                            <div className="space-y-1">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="h-9 w-full bg-muted/50 animate-pulse rounded-md" />
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                            <div className="space-y-1">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-9 w-full bg-muted/50 animate-pulse rounded-md" />
                                ))}
                            </div>
                        </div>
                    </div>
                </SidebarContent>
            </Sidebar>
        );
    }

    const filterItems = (items: typeof mainNavItems) => {
        return items.filter((item) => {
            if (!item.requiredPermission) return true;
            return hasPermission(item.requiredPermission, 'read');
        });
    };

    const filteredMainNavItems = filterItems(mainNavItems);
    const filteredGuideNavItems = filterItems(guideNavItems);

    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2 px-2 py-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white font-bold">
                        S
                    </div>
                    <span className="text-lg font-semibold">Smetalab</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                {filteredMainNavItems.length > 0 && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Навигация</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {filteredMainNavItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={pathname === item.url}>
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
                )}

                {filteredGuideNavItems.length > 0 && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Справочники</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {filteredGuideNavItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === item.url}
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
                )}
            </SidebarContent>
            <SidebarFooter />
        </Sidebar>
    );
}
