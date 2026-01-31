'use client';

import { usePermissionsContext } from '@/components/permissions-provider';
import { useCallback } from 'react';

// Re-export type if needed, or import from provider
export interface PermissionEntry {
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
    // We assume this is used inside PermissionsProvider. 
    // If used outside, it throws (which is good, catches bugs).
    // Or we could try catch? But strict is better.
    const { permissions } = usePermissionsContext();

    const hasPermission = useCallback((code: string, requiredLevel: 'read' | 'manage' = 'read'): boolean => {
        const perm = permissions.find(p => p.code === code);
        if (!perm) return false;

        if (requiredLevel === 'manage') {
            return perm.level === 'manage';
        }

        return true;
    }, [permissions]);

    const canRead = useCallback((code: string) => hasPermission(code, 'read'), [hasPermission]);
    const canManage = useCallback((code: string) => hasPermission(code, 'manage'), [hasPermission]);

    const hasAnyPermission = useCallback((...codes: string[]): boolean => {
        return codes.some(code => permissions.some(p => p.code === code));
    }, [permissions]);

    return {
        permissions,
        loading: false, // No loading anymore, data is SRR/Hydrated
        hasPermission,
        canRead,
        canManage,
        hasAnyPermission,
    };
}
