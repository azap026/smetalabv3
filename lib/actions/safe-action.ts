/* eslint-disable no-redeclare */
import * as Sentry from '@sentry/nextjs';
import { Result, error } from '@/lib/utils/result';
import { User, Team } from '@/lib/db/schema';
import { getUser, getTeamForUser } from '@/lib/db/queries';

export type ActionContext = {
    user: User;
    team: Team;
};

export type ActionContextOptionalTeam = {
    user: User;
    team?: Team;
};

export type SafeActionOptions = {
    requireTeam?: boolean;
    name?: string;
};

export function safeAction<T, Args extends unknown[]>(
    handler: (context: ActionContext, ...args: Args) => Promise<Result<T>>,
    options?: { requireTeam?: true; name?: string }
): (...args: Args) => Promise<Result<T>>;

export function safeAction<T, Args extends unknown[]>(
    handler: (context: ActionContextOptionalTeam, ...args: Args) => Promise<Result<T>>,
    options: { requireTeam: false; name?: string }
): (...args: Args) => Promise<Result<T>>;

/* eslint-disable no-redeclare, @typescript-eslint/no-explicit-any */
export function safeAction<T, Args extends unknown[]>(
    handler: (context: any, ...args: Args) => Promise<Result<T>>,
    options: SafeActionOptions = { requireTeam: true }
) {
    /* eslint-enable no-redeclare, @typescript-eslint/no-explicit-any */
    return async (...args: Args): Promise<Result<T>> => {
        const start = Date.now();
        const actionName = options.name || handler.name || 'AnonymousAction';

        try {
            const user = await getUser();
            if (!user) {
                console.warn(`⚠️ [Action ${actionName}] Unauthorized access attempt`);
                return error('Пользователь не авторизован', 'UNAUTHORIZED');
            }

            // Set Sentry user context
            Sentry.setUser({ id: user.id.toString(), email: user.email });

            let team = undefined;
            if (options.requireTeam !== false) {
                team = await getTeamForUser();
                if (!team) {
                    console.warn(`⚠️ [Action ${actionName}] Team not found for User ${user.id}`);
                    return error('Команда не найдена', 'TEAM_NOT_FOUND');
                }
                Sentry.setTag("team_id", team.id.toString());
            } else {
                team = await getTeamForUser() || undefined;
            }

            // Execute handler
            const result = await handler({ user, team }, ...args);

            const duration = Date.now() - start;

            // Log success
            console.log(`🔹 [Action] User:${user.id} | ${actionName} | Time:${duration}ms`);

            return result;
        } catch (e) {
            console.error(`🔥 [Action Error] ${actionName}`, e);

            // Report to Sentry with context
            Sentry.captureException(e, {
                tags: {
                    action: actionName,
                },
                extra: {
                    args: JSON.stringify(args, (key, value) => {
                        if (typeof key === 'string' && (key.toLowerCase().includes('password') || key.toLowerCase().includes('token'))) {
                            return '***';
                        }
                        return value;
                    }),
                }
            });

            return error('Внутренняя ошибка сервера', 'INTERNAL_ERROR');
        }
    };
}
