'use client';

import * as React from 'react';
import { LogOut, Settings, Users, Shield } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from '@/app/(login)/actions';
import { useRouter, usePathname } from 'next/navigation';

import { User as UserType } from '@/lib/db/schema';
import { usePermissions } from '@/hooks/use-permissions';
import { useUserContext } from '@/components/permissions-provider';



export function UserMenu() {
    const [mounted, setMounted] = React.useState(false);
    const { user, loading } = useUserContext();
    const router = useRouter();
    const pathname = usePathname();
    const { hasPermission } = usePermissions();

    React.useEffect(() => {
        setMounted(true);
    }, []);

    async function handleSignOut() {
        await signOut();
        // mutate('/api/user'); // No longer needed with server actions/context reload
        router.push('/');
        router.refresh();
    }

    const getUserInitials = (user: UserType | undefined | null) => {
        if (!user) return '?';
        if (user.name) {
            return user.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
        }
        return user.email.slice(0, 2).toUpperCase();
    };

    if (!mounted || loading || !user) {
        return (
            <Button variant="ghost" className="relative h-8 w-8 rounded-full" disabled>
                <Avatar className="h-8 w-8">
                    <AvatarFallback>?</AvatarFallback>
                </Avatar>
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt={user.name || user.email} />
                        <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {user.name || 'Пользователь'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {hasPermission('team', 'read') && (
                    <DropdownMenuItem onClick={() => router.push('/app/team')}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Команда</span>
                    </DropdownMenuItem>
                )}
                {hasPermission('settings', 'read') && (
                    <DropdownMenuItem onClick={() => router.push('/app/settings')}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Настройки</span>
                    </DropdownMenuItem>
                )}
                {hasPermission('platform.tenants', 'read') && !pathname?.startsWith('/dashboard') && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Платформа</span>
                        </DropdownMenuItem>
                    </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Выйти</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
