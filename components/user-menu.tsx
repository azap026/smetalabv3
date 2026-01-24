'use client';

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
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { User as UserType } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function UserMenu() {
    const { data: user } = useSWR<UserType>('/api/user', fetcher);
    const router = useRouter();

    async function handleSignOut() {
        await signOut();
        mutate('/api/user');
        router.push('/');
    }

    const getUserInitials = (user: UserType | undefined) => {
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

    if (!user) {
        return (
            <Avatar className="h-8 w-8">
                <AvatarFallback>?</AvatarFallback>
            </Avatar>
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
                <DropdownMenuItem onClick={() => router.push('/app/team')}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Команда</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/app/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Настройки</span>
                </DropdownMenuItem>
                {user.isAdmin && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Admin Panel</span>
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
