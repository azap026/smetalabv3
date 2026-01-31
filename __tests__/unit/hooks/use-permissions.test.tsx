
import { renderHook } from '@testing-library/react';
import { usePermissions, PermissionEntry } from '@/hooks/use-permissions';
import { UserProvider } from '@/components/permissions-provider';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

const wrapper = ({ children, permissions }: { children: React.ReactNode, permissions: PermissionEntry[] }) => (
    <UserProvider permissions={permissions} user={null}>
        {children}
    </UserProvider>
);

describe('usePermissions hook', () => {
    it('should return correct permissions status', () => {
        const permissions: PermissionEntry[] = [
            { code: 'works', level: 'manage' },
            { code: 'materials', level: 'read' }
        ];

        const { result } = renderHook(() => usePermissions(), {
            wrapper: (props) => wrapper({ ...props, permissions })
        });

        expect(result.current.canManage('works')).toBe(true);
        expect(result.current.canRead('works')).toBe(true);
        expect(result.current.canManage('materials')).toBe(false);
        expect(result.current.canRead('materials')).toBe(true);
        expect(result.current.canRead('unknown')).toBe(false);
    });

    it('should handle hasAnyPermission correctly', () => {
        const permissions: PermissionEntry[] = [
            { code: 'works', level: 'read' }
        ];

        const { result } = renderHook(() => usePermissions(), {
            wrapper: (props) => wrapper({ ...props, permissions })
        });

        expect(result.current.hasAnyPermission('works', 'materials')).toBe(true);
        expect(result.current.hasAnyPermission('materials', 'counterparties')).toBe(false);
    });

    it('should throw if used outside UserProvider', () => {
        // Suppress console.error for this test
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
        expect(() => renderHook(() => usePermissions())).toThrow('useUserContext must be used within a UserProvider');
        spy.mockRestore();
    });
});
