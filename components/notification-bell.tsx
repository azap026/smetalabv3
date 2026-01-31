'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import * as React from 'react';
import useSWR, { mutate } from 'swr';
import { useState, useEffect } from 'react';

interface Notification {
    id: number;
    title: string;
    description: string;
    createdAt: string;
    read: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " г. назад";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " мес. назад";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " дн. назад";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " ч. назад";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " мин. назад";
    return "менее минуты назад";
}

export function NotificationBell() {
    const [mounted, setMounted] = useState(false);
    const { data: notifications, isLoading } = useSWR<Notification[]>('/api/notifications', fetcher);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const unreadCount = notifications?.filter((n) => !n.read).length || 0;

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="relative" disabled>
                <Bell className="h-5 w-5" />
                <span className="sr-only">Уведомления</span>
            </Button>
        );
    }

    const handleMarkAsRead = async (id: number) => {
        // Optimistic update
        mutate('/api/notifications', (currentNotifications: Notification[] | undefined) => {
            if (!currentNotifications) return [];
            return currentNotifications.map(n => n.id === id ? { ...n, read: true } : n);
        }, false);

        try {
            await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
            mutate('/api/notifications'); // Revalidate to ensure data consistency
        } catch (error) {
            console.error('Failed to mark as read', error);
            mutate('/api/notifications'); // Revert on error
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                    <span className="sr-only">Уведомления</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <h4 className="font-semibold">Уведомления</h4>
                    {unreadCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                            {unreadCount} новых
                        </span>
                    )}
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {isLoading ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Загрузка...
                        </p>
                    ) : !notifications || notifications.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Нет уведомлений
                        </p>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                                className={`p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors ${!notification.read ? 'bg-muted/50' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-2">
                                    {!notification.read && (
                                        <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                                    )}
                                    <div className={!notification.read ? '' : 'ml-4'}>
                                        <p className="text-sm font-medium">{notification.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {notification.description}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {timeAgo(notification.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="border-t pt-2 mt-2">
                    <Button variant="ghost" className="w-full text-sm">
                        Показать все уведомления
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
