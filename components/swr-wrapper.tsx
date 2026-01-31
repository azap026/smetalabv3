'use client';

import { SWRConfig } from 'swr';
import { use } from 'react';
import { User } from '@/lib/db/schema';

export function SWRWrapper({
    children,
    userPromise
}: {
    children: React.ReactNode;
    userPromise: Promise<User | null>;
}) {
    const user = use(userPromise);

    return (
        <SWRConfig
            value={{
                fallback: {
                    '/api/user': user
                }
            }}
        >
            {children}
        </SWRConfig>
    );
}
