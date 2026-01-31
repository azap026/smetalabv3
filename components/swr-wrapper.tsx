'use client';

import { SWRConfig } from 'swr';
import { use } from 'react';
import { User, Team } from '@/lib/db/schema';

export function SWRWrapper({
    children,
    userPromise,
    teamPromise
}: {
    children: React.ReactNode;
    userPromise: Promise<User | null>;
    teamPromise: Promise<Team | null>;
}) {
    const user = use(userPromise);
    const team = use(teamPromise);

    return (
        <SWRConfig
            value={{
                fallback: {
                    '/api/user': user,
                    '/api/team': team
                }
            }}
        >
            {children}
        </SWRConfig>
    );
}
