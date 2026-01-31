'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Building2, Settings2, Eye, Edit3, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    tenantRoleMap: Record<string, Record<number, string>>;
    platformRoleMap: Record<string, Record<number, string>>;
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

    async function setLevel(
        type: 'tenant' | 'platform',
        role: string,
        permissionId: number,
        level: 'none' | 'read' | 'manage'
    ) {
        const key = `${type}-${role}-${permissionId}`;
        setUpdating(key);

        try {
            const response = await fetch('/api/admin/permissions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, role, permissionId, level }),
            });

            if (response.ok) {
                await fetchPermissions();
            }
        } catch (error) {
            console.error('Failed to update level:', error);
        } finally {
            setUpdating(null);
        }
    }

    if (loading) return <Skeleton className="h-[400px] w-full rounded-2xl" />;
    if (!data) return null;

    const renderHeader = (roles: string[]) => (
        <thead className="bg-gray-50/80 backdrop-blur sticky top-0 z-20 border-b">
            <tr>
                <th className="text-left py-4 px-6 font-bold text-[10px] uppercase tracking-widest text-muted-foreground w-1/3">Функциональная область</th>
                {roles.map(role => (
                    <th key={role} className="text-center py-4 px-2 border-l border-gray-100">
                        <Badge variant="outline" className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md border-gray-200">
                            {ROLE_LABELS[role]}
                        </Badge>
                    </th>
                ))}
            </tr>
        </thead>
    );

    const renderRow = (type: 'tenant' | 'platform', perm: Permission, roles: string[], roleMap: Record<string, Record<number, string>>) => (
        <tr key={perm.id} className="border-b last:border-0 hover:bg-zinc-50/50 transition-colors">
            <td className="py-4 px-6">
                <div className="flex flex-col">
                    <span className="text-sm font-black text-zinc-900 tracking-tight">{perm.name}</span>
                    <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed max-w-xs">{perm.description}</p>
                </div>
            </td>
            {roles.map(role => {
                const currentLevel = roleMap[role]?.[perm.id] || 'none';
                const isUpdating = updating === `${type}-${role}-${perm.id}`;

                return (
                    <td key={role} className="py-4 px-2 border-l border-gray-50">
                        <div className="flex items-center justify-center">
                            <div className="flex p-1 bg-zinc-100 rounded-xl gap-1">
                                <TooltipProvider delayDuration={200}>
                                    {/* NONE */}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => setLevel(type, role, perm.id, 'none')}
                                                className={`p-1.5 rounded-lg transition-all ${currentLevel === 'none' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
                                                disabled={isUpdating}
                                            >
                                                <XCircle className="h-4 w-4" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent className="text-[10px]">Отключить (скрыть)</TooltipContent>
                                    </Tooltip>

                                    {/* READ */}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => setLevel(type, role, perm.id, 'read')}
                                                className={`p-1.5 rounded-lg transition-all ${currentLevel === 'read' ? 'bg-blue-500 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                                                disabled={isUpdating}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent className="text-[10px]">Чтение (только просмотр)</TooltipContent>
                                    </Tooltip>

                                    {/* MANAGE */}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => setLevel(type, role, perm.id, 'manage')}
                                                className={`p-1.5 rounded-lg transition-all ${currentLevel === 'manage' ? 'bg-orange-500 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                                                disabled={isUpdating}
                                            >
                                                <Edit3 className="h-4 w-4" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent className="text-[10px]">Полный доступ (ред.)</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                    </td>
                );
            })}
        </tr>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-zinc-900 tracking-tight uppercase italic flex items-center gap-2">
                        <Settings2 className="h-5 w-5" /> Контроль доступа
                    </h2>
                    <p className="text-xs text-zinc-500 font-medium">Модель прав 3-го уровня: <span className="text-zinc-400 font-bold">Выкл</span> / <span className="text-blue-500 font-bold">Чтение</span> / <span className="text-orange-500 font-bold">Полный</span></p>
                </div>
            </div>

            <Tabs defaultValue="tenant" className="w-full">
                <TabsList className="bg-zinc-100 p-1 mb-6 h-12 rounded-2xl w-full sm:w-auto">
                    <TabsTrigger value="tenant" className="rounded-xl px-8 font-black text-xs uppercase data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">
                        <Users className="h-4 w-4 mr-2" /> Роли команды
                    </TabsTrigger>
                    <TabsTrigger value="platform" className="rounded-xl px-8 font-black text-xs uppercase data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">
                        <Building2 className="h-4 w-4 mr-2" /> Платформа
                    </TabsTrigger>
                </TabsList>

                <div className="bg-white border-2 border-zinc-100 rounded-[2rem] overflow-hidden shadow-2xl shadow-zinc-200/50">
                    <TabsContent value="tenant" className="m-0 overflow-x-auto">
                        <table className="w-full border-collapse">
                            {renderHeader(data.tenantRoles)}
                            <tbody>
                                {data.tenantPermissions.map((perm) => renderRow('tenant', perm, data.tenantRoles, data.tenantRoleMap))}
                            </tbody>
                        </table>
                    </TabsContent>

                    <TabsContent value="platform" className="m-0 overflow-x-auto">
                        <table className="w-full border-collapse">
                            {renderHeader(data.platformRoles)}
                            <tbody>
                                {data.platformPermissions.map((perm) => renderRow('platform', perm, data.platformRoles, data.platformRoleMap))}
                            </tbody>
                        </table>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
