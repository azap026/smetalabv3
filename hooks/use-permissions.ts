'use client';

import { useEffect, useState } from 'react';

interface UsePermissionsOptions {
    tenantId?: number;
}

interface UsePermissionsResult {
    permissions: string[];
    loading: boolean;
    hasPermission: (code: string) => boolean;
    hasAnyPermission: (...codes: string[]) => boolean;
    hasAllPermissions: (...codes: string[]) => boolean;
}

export function usePermissions(options: UsePermissionsOptions = {}): UsePermissionsResult {
    const [permissions, setPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPermissions() {
            try {
                const params = new URLSearchParams();
                if (options.tenantId) {
                    params.set('tenantId', options.tenantId.toString());
                }

                const response = await fetch(`/api/user/permissions?${params}`);
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
    }, [options.tenantId]);

    const hasPermission = (code: string): boolean => {
        return permissions.includes(code);
    };

    const hasAnyPermission = (...codes: string[]): boolean => {
        return codes.some(code => permissions.includes(code));
    };

    const hasAllPermissions = (...codes: string[]): boolean => {
        return codes.every(code => permissions.includes(code));
    };

    return {
        permissions,
        loading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
    };
}
