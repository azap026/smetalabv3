'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface Notification {
    id: string;
    title: string;
    description: string;
    time: string;
    read: boolean;
}

// TODO: Replace with real notifications from API
const mockNotifications: Notification[] = [
    {
        id: '1',
        title: 'Новый проект создан',
        description: 'Проект "Ремонт офиса" успешно создан',
        time: '5 мин назад',
        read: false,
    },
    {
        id: '2',
        title: 'Смета обновлена',
        description: 'Смета по проекту была изменена',
        time: '1 час назад',
        read: false,
    },
    {
        id: '3',
        title: 'Закупка завершена',
        description: 'Материалы доставлены на объект',
        time: '2 часа назад',
        read: true,
    },
];

export function NotificationBell() {
    const unreadCount = mockNotifications.filter((n) => !n.read).length;

    return (
        <Popover>
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
                    {mockNotifications.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Нет уведомлений
                        </p>
                    ) : (
                        mockNotifications.map((notification) => (
                            <div
                                key={notification.id}
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
                                            {notification.time}
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
