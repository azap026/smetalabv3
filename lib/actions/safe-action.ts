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
        // Приоритет имени из опций, затем имя функции, затем дефолт
        const actionName = options.name || handler.name || 'AnonymousAction';

        try {
            const user = await getUser();
            if (!user) {
                console.warn(`⚠️ [Action ${actionName}] Unauthorized access attempt`);
                return error('Пользователь не авторизован', 'UNAUTHORIZED');
            }

            let team = undefined;
            if (options.requireTeam !== false) {
                team = await getTeamForUser();
                if (!team) {
                    console.warn(`⚠️ [Action ${actionName}] Team not found for User ${user.id}`);
                    return error('Команда не найдена', 'TEAM_NOT_FOUND');
                }
            } else {
                team = await getTeamForUser() || undefined;
            }

            // Выполняем действие
            const result = await handler({ user, team }, ...args);

            const duration = Date.now() - start;

            // Логируем успешное выполнение с аргументами (скрывая чувствительные данные)
            console.log(`🔹 [Action] User:${user.id} | ${actionName} | Time:${duration}ms | Args:`,
                JSON.stringify(args, (key, value) => {
                    if (typeof key === 'string' && (key.toLowerCase().includes('password') || key.toLowerCase().includes('token'))) {
                        return '***';
                    }
                    if (typeof value === 'string' && value.length > 200) {
                        return value.substring(0, 20) + '...[truncated]';
                    }
                    return value;
                })
            );

            return result;
        } catch (e) {
            console.error(`🔥 [Action Error] User:${(await getUser())?.id || 'unknown'} | ${actionName}`, e);
            return error('Внутренняя ошибка сервера', 'INTERNAL_ERROR');
        }
    };
}
