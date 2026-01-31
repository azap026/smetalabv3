import * as Sentry from '@sentry/nextjs';
import { Result, error } from '@/lib/utils/result';
import { User, Team, TenantRole, teamMembers } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { eq } from 'drizzle-orm';

export type ActionContext = {
    user: User;
    team: Team;
    role: TenantRole;
};

export type ActionContextOptionalTeam = {
    user: User;
    team?: Team;
    role?: TenantRole;
};

export type SafeActionOptions = {
    requireTeam?: boolean;
    name?: string;
    allowedRoles?: TenantRole[];
};

/**
 * Обертка для серверных действий (Server Actions) с проверкой авторизации и RBAC.
 * По умолчанию требует наличие команды (team).
 * Использует Generic R для автоматического определения типа контекста в зависимости от options.
 */
export function safeAction<
    T,
    Args extends unknown[],
    R extends boolean = true
>(
    handler: (
        context: R extends false ? ActionContextOptionalTeam : ActionContext,
        ...args: Args
    ) => Promise<Result<T>>,
    options?: { requireTeam?: R; name?: string; allowedRoles?: TenantRole[] }
): (...args: Args) => Promise<Result<T>> {
    return async (...args: Args): Promise<Result<T>> => {
        const start = Date.now();
        const currentOptions = (options || {}) as SafeActionOptions;
        const requireTeam = currentOptions.requireTeam !== false;
        const actionName = currentOptions.name || handler.name || 'AnonymousAction';

        try {
            const user = await getUser();
            if (!user) {
                console.warn(`⚠️ [Action ${actionName}] Unauthorized access attempt`);
                return error('Пользователь не авторизован', 'UNAUTHORIZED');
            }

            // Set Sentry user context
            Sentry.setUser({ id: user.id.toString(), email: user.email });

            let team: Team | undefined = undefined;
            let role: TenantRole | undefined = undefined;

            const teamResult = await db.query.teamMembers.findFirst({
                where: eq(teamMembers.userId, user.id),
                with: { team: true }
            });

            if (requireTeam) {
                if (!teamResult) {
                    console.warn(`⚠️ [Action ${actionName}] Team not found for User ${user.id}`);
                    return error('Команда не найдена', 'TEAM_NOT_FOUND');
                }
                team = teamResult.team;
                role = teamResult.role as TenantRole;
                Sentry.setTag("team_id", team.id.toString());
                Sentry.setTag("user_role", role);
            } else if (teamResult) {
                team = teamResult.team;
                role = teamResult.role as TenantRole;
            }

            // RBAC Check
            if (currentOptions.allowedRoles && currentOptions.allowedRoles.length > 0) {
                if (!role || !currentOptions.allowedRoles.includes(role)) {
                    console.warn(`⚠️ [Action ${actionName}] Forbidden: User ${user.id} with role ${role} tried to access action requiring [${currentOptions.allowedRoles.join(', ')}]`);
                    return error('Доступ запрещен', 'FORBIDDEN');
                }
            }

            // Execute handler
            // Используем функциональный тип для избежания any, при этом гарантируем безопасность типизации 
            // через предварительные проверки requireTeam в коде выше.
            const result = await (handler as (c: ActionContextOptionalTeam, ...a: Args) => Promise<Result<T>>)(
                { user, team, role },
                ...args
            );

            const duration = Date.now() - start;

            // Log success
            console.log(`🔹 [Action] User:${user.id} (${role}) | ${actionName} | Time:${duration}ms`);

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
