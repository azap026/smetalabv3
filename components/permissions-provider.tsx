'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { User } from '@/lib/db/schema';

export interface PermissionEntry {
    code: string;
    level: 'read' | 'manage';
}

interface UserContextType {
    permissions: PermissionEntry[];
    user: User | null;
    loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({
    permissions,
    user,
    children
}: {
    permissions: PermissionEntry[];
    user: User | null;
    children: ReactNode;
}) {
    return (
        <UserContext.Provider value={{ permissions, user, loading: false }}>
            {children}
        </UserContext.Provider>
    );
}

// Alias for backward compatibility if needed, but better use useUserContext
export const usePermissionsContext = () => useUserContext();

export function useUserContext() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUserContext must be used within a UserProvider');
    }
    return context;
}
