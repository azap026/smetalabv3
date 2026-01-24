'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X, Shield, Users, Building2 } from 'lucide-react';

interface Permission {
    id: number;
    code: string;
    name: string;
    description: string | null;
    scope: 'platform' | 'tenant';
}

interface PermissionsData {
    tenantPermissions: Permission[];
    platformPermissions: Permission[];
    tenantRoleMap: Record<string, number[]>;
    platformRoleMap: Record<string, number[]>;
    tenantRoles: string[];
    platformRoles: string[];
}

const ROLE_LABELS: Record<string, string> = {
    admin: 'Админ',
    estimator: 'Сметчик',
    manager: 'Менеджер',
    superadmin: 'Суперадмин',
    support: 'Поддержка',
};

const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-red-100 text-red-800',
    estimator: 'bg-blue-100 text-blue-800',
    manager: 'bg-green-100 text-green-800',
    superadmin: 'bg-purple-100 text-purple-800',
    support: 'bg-orange-100 text-orange-800',
};

export function PermissionsMatrix() {
    const [data, setData] = useState<PermissionsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetchPermissions();
    }, []);

    async function fetchPermissions() {
        try {
            const response = await fetch('/api/admin/permissions');
            if (response.ok) {
                const result = await response.json();
                setData(result);
            }
        } catch (error) {
            console.error('Failed to fetch permissions:', error);
        } finally {
            setLoading(false);
        }
    }

    async function togglePermission(
        type: 'tenant' | 'platform',
        role: string,
        permissionId: number,
        currentlyEnabled: boolean
    ) {
        const key = `${type}-${role}-${permissionId}`;
        setUpdating(key);

        try {
            const response = await fetch('/api/admin/permissions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    role,
                    permissionId,
                    enabled: !currentlyEnabled,
                }),
            });

            if (response.ok) {
                await fetchPermissions();
            }
        } catch (error) {
            console.error('Failed to update permission:', error);
        } finally {
            setUpdating(null);
        }
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card>
                <CardContent className="py-8">
                    <p className="text-center text-gray-500">Не удалось загрузить данные</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Tabs defaultValue="tenant" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tenant" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Роли тенанта
                </TabsTrigger>
                <TabsTrigger value="platform" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Роли платформы
                </TabsTrigger>
            </TabsList>

            <TabsContent value="tenant">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-orange-500" />
                            Матрица прав для ролей тенанта
                        </CardTitle>
                        <CardDescription>
                            Определяет, какие действия доступны пользователям в рамках их команды
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-medium text-gray-500">Разрешение</th>
                                        {data.tenantRoles.map(role => (
                                            <th key={role} className="text-center py-3 px-4 min-w-[100px]">
                                                <Badge variant="outline" className={ROLE_COLORS[role]}>
                                                    {ROLE_LABELS[role]}
                                                </Badge>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.tenantPermissions.map((perm, idx) => (
                                        <tr key={perm.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                                            <td className="py-3 px-4">
                                                <div className="font-medium text-gray-900">{perm.name}</div>
                                                <div className="text-xs text-gray-500">{perm.code}</div>
                                            </td>
                                            {data.tenantRoles.map(role => {
                                                const hasPermission = data.tenantRoleMap[role]?.includes(perm.id);
                                                const isUpdating = updating === `tenant-${role}-${perm.id}`;

                                                return (
                                                    <td key={role} className="text-center py-3 px-4">
                                                        <button
                                                            onClick={() => togglePermission('tenant', role, perm.id, hasPermission)}
                                                            disabled={isUpdating}
                                                            className={`
                                p-2 rounded-full transition-all
                                ${hasPermission
                                                                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}
                                ${isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                              `}
                                                        >
                                                            {hasPermission ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="platform">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-purple-500" />
                            Матрица прав для ролей платформы
                        </CardTitle>
                        <CardDescription>
                            Определяет доступ к административным функциям платформы
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-medium text-gray-500">Разрешение</th>
                                        {data.platformRoles.map(role => (
                                            <th key={role} className="text-center py-3 px-4 min-w-[100px]">
                                                <Badge variant="outline" className={ROLE_COLORS[role]}>
                                                    {ROLE_LABELS[role]}
                                                </Badge>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.platformPermissions.map((perm, idx) => (
                                        <tr key={perm.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                                            <td className="py-3 px-4">
                                                <div className="font-medium text-gray-900">{perm.name}</div>
                                                <div className="text-xs text-gray-500">{perm.code}</div>
                                            </td>
                                            {data.platformRoles.map(role => {
                                                const hasPermission = data.platformRoleMap[role]?.includes(perm.id);
                                                const isUpdating = updating === `platform-${role}-${perm.id}`;

                                                return (
                                                    <td key={role} className="text-center py-3 px-4">
                                                        <button
                                                            onClick={() => togglePermission('platform', role, perm.id, hasPermission)}
                                                            disabled={isUpdating}
                                                            className={`
                                p-2 rounded-full transition-all
                                ${hasPermission
                                                                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}
                                ${isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                              `}
                                                        >
                                                            {hasPermission ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
