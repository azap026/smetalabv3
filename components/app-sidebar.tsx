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
    BookOpen,
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

    if (loading) return null;

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
