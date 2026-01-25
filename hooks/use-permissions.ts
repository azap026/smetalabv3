'use client';

import { useEffect, useState } from 'react';

interface PermissionEntry {
    code: string;
    level: 'read' | 'manage';
}

interface UsePermissionsResult {
    permissions: PermissionEntry[];
    loading: boolean;
    hasPermission: (code: string, requiredLevel?: 'read' | 'manage') => boolean;
    canRead: (code: string) => boolean;
    canManage: (code: string) => boolean;
    hasAnyPermission: (...codes: string[]) => boolean;
}

export function usePermissions(): UsePermissionsResult {
    const [permissions, setPermissions] = useState<PermissionEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPermissions() {
            try {
                const response = await fetch('/api/user');
                if (response.ok) {
                    const data = await response.json();
                    setPermissions(data.permissions || []);
                }
            } catch (error) {
                console.error('Failed to fetch permissions:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchPermissions();
    }, []);

    const hasPermission = (code: string, requiredLevel: 'read' | 'manage' = 'read'): boolean => {
        const perm = permissions.find(p => p.code === code);
        if (!perm) return false;

        if (requiredLevel === 'manage') {
            return perm.level === 'manage';
        }

        return true; // if they have it at all, they can read
    };

    const canRead = (code: string) => hasPermission(code, 'read');
    const canManage = (code: string) => hasPermission(code, 'manage');

    const hasAnyPermission = (...codes: string[]): boolean => {
        return codes.some(code => permissions.some(p => p.code === code));
    };

    return {
        permissions,
        loading,
        hasPermission,
        canRead,
        canManage,
        hasAnyPermission,
    };
}
