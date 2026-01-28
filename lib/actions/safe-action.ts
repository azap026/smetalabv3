/* eslint-disable no-redeclare */
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
};

export function safeAction<T, Args extends unknown[]>(
    handler: (context: ActionContext, ...args: Args) => Promise<Result<T>>,
    options?: { requireTeam?: true }
): (...args: Args) => Promise<Result<T>>;

export function safeAction<T, Args extends unknown[]>(
    handler: (context: ActionContextOptionalTeam, ...args: Args) => Promise<Result<T>>,
    options: { requireTeam: false }
): (...args: Args) => Promise<Result<T>>;

/* eslint-disable no-redeclare, @typescript-eslint/no-explicit-any */
export function safeAction<T, Args extends unknown[]>(
    handler: (context: any, ...args: Args) => Promise<Result<T>>,
    options: SafeActionOptions = { requireTeam: true }
) {
    /* eslint-enable no-redeclare, @typescript-eslint/no-explicit-any */
    return async (...args: Args): Promise<Result<T>> => {
        try {
            const user = await getUser();
            if (!user) {
                return error('Пользователь не авторизован', 'UNAUTHORIZED');
            }

            let team = undefined;
            if (options.requireTeam !== false) {
                team = await getTeamForUser();
                if (!team) {
                    return error('Команда не найдена', 'TEAM_NOT_FOUND');
                }
            } else {
                team = await getTeamForUser() || undefined;
            }

            return await handler({ user, team }, ...args);
        } catch (e) {
            console.error('Action execution error:', e);
            return error('Внутренняя ошибка сервера', 'INTERNAL_ERROR');
        }
    };
}
