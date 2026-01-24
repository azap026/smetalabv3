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
];

const guideNavItems = [
    {
        title: 'Справочник',
        url: '/app/guide',
        icon: BookOpen,
    },
    {
        title: 'Работы',
        url: '/app/guide/works',
        icon: Wrench,
    },
    {
        title: 'Материалы',
        url: '/app/guide/materials',
        icon: Package,
    },
    {
        title: 'Контрагенты',
        url: '/app/guide/counterparties',
        icon: Users,
    },
];

export function AppSidebar() {
    const pathname = usePathname();

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
                <SidebarGroup>
                    <SidebarGroupLabel>Навигация</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainNavItems.map((item) => (
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
                <SidebarGroup>
                    <SidebarGroupLabel>Справочники</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {guideNavItems.map((item) => (
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
            </SidebarContent>
            <SidebarFooter>
                {/* TODO: User menu / logout */}
            </SidebarFooter>
        </Sidebar>
    );
}
