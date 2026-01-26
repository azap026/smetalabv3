'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MoreHorizontal, UserPlus, Trash2, Mail } from 'lucide-react';
import { inviteTeamMember, removeTeamMember } from '@/app/(login)/actions';
import { usePermissions } from '@/hooks/use-permissions';

interface TeamMember {
    id: number;
    role: string;
    joinedAt: string;
    user: {
        id: number;
        name: string | null;
        email: string;
    };
}

interface TeamData {
    id: number;
    name: string;
    teamMembers: TeamMember[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TeamPage() {
    const { data: team, isLoading } = useSWR<TeamData>('/api/team', fetcher);
    const { hasPermission } = usePermissions();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'admin' | 'estimator' | 'manager'>('estimator');
    const [isInviting, setIsInviting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsInviting(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('email', email);
        formData.append('role', role);

        const result = await inviteTeamMember({ email, role }, formData);

        if (result && 'error' in result && result.error) {
            setMessage({ type: 'error', text: result.error });
        } else if (result && 'success' in result && result.success) {
            setMessage({ type: 'success', text: result.success });
            setEmail('');
        }
        setIsInviting(false);
    };

    const handleRemove = async (memberId: number) => {
        const formData = new FormData();
        formData.append('memberId', memberId.toString());

        const result = await removeTeamMember({ memberId }, formData);

        if (result && 'error' in result && result.error) {
            setMessage({ type: 'error', text: result.error });
        } else if (result && 'success' in result && result.success) {
            setMessage({ type: 'success', text: result.success });
            mutate('/api/team');
        }
    };

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'admin':
                return 'default';
            case 'estimator':
                return 'secondary';
            case 'manager':
                return 'outline';
            default:
                return 'outline';
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin':
                return 'Администратор';
            case 'estimator':
                return 'Сметчик';
            case 'manager':
                return 'Менеджер';
            default:
                return role;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Загрузка...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Team Info */}
            <Card>
                <CardHeader>
                    <CardTitle>{team?.name || 'Команда'}</CardTitle>
                    <CardDescription>
                        Управление участниками вашей организации
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Invite Form */}
            {hasPermission('team', 'manage') && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            Пригласить участника
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleInvite} className="flex gap-4 items-end">
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="colleague@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Роль</Label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-32">
                                            {getRoleLabel(role)}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => setRole('admin')}>
                                            Администратор
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setRole('estimator')}>
                                            Сметчик
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setRole('manager')}>
                                            Менеджер
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <Button type="submit" disabled={isInviting}>
                                <Mail className="mr-2 h-4 w-4" />
                                {isInviting ? 'Отправка...' : 'Пригласить'}
                            </Button>
                        </form>
                        {message && (
                            <p
                                className={`mt-4 text-sm ${message.type === 'error' ? 'text-destructive' : 'text-green-600'
                                    }`}
                            >
                                {(() => {
                                    if (!message.text) return null;
                                    const urlMatch = message.text.match(/\(Dev Link: (http[^)]+)\)/);

                                    if (urlMatch) {
                                        const [fullMatch, url] = urlMatch;
                                        const textPart = message.text.split(fullMatch)[0];
                                        return (
                                            <>
                                                {textPart}
                                                <span className="text-muted-foreground">(Dev Link: </span>
                                                <a href={url} className="underline hover:text-blue-600" target="_blank" rel="noopener noreferrer">
                                                    Перейти
                                                </a>
                                                <span className="text-muted-foreground">)</span>
                                            </>
                                        );
                                    }
                                    return message.text;
                                })()}
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            <Separator />

            {/* Team Members List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        Участники ({team?.teamMembers?.length || 0})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {team?.teamMembers?.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between p-4 rounded-lg border"
                            >
                                <div className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarFallback>
                                            {member.user.name
                                                ? member.user.name
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')
                                                    .toUpperCase()
                                                    .slice(0, 2)
                                                : member.user.email.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">
                                            {member.user.name || member.user.email}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {member.user.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant={getRoleBadgeVariant(member.role)}>
                                        {getRoleLabel(member.role)}
                                    </Badge>
                                    {hasPermission('team', 'manage') && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => handleRemove(member.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Удалить
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </div>
                        ))}
                        {(!team?.teamMembers || team.teamMembers.length === 0) && (
                            <p className="text-center text-muted-foreground py-8">
                                Нет участников в команде
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
