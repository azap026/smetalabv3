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

/* eslint-disable no-redeclare, @typescript-eslint/no-explicit-any */
export function safeAction<T, Args extends unknown[]>(
    handler: (context: ActionContext, ...args: Args) => Promise<Result<T>>,
    options?: { requireTeam?: true; name?: string; allowedRoles?: TenantRole[] }
): (...args: Args) => Promise<Result<T>>;

export function safeAction<T, Args extends unknown[]>(
    handler: (context: ActionContextOptionalTeam, ...args: Args) => Promise<Result<T>>,
    options: { requireTeam: false; name?: string; allowedRoles?: TenantRole[] }
): (...args: Args) => Promise<Result<T>>;

export function safeAction<T, Args extends unknown[]>(
    handler: (context: any, ...args: Args) => Promise<Result<T>>,
    options: SafeActionOptions = { requireTeam: true }
) {
    return async (...args: Args): Promise<Result<T>> => {
        const start = Date.now();
        const actionName = options.name || (handler as any).name || 'AnonymousAction';
/* eslint-enable no-redeclare, @typescript-eslint/no-explicit-any */

        try {
            const user = await getUser();
            if (!user) {
                console.warn(`⚠️ [Action ${actionName}] Unauthorized access attempt`);
                return error('Пользователь не авторизован', 'UNAUTHORIZED');
            }

            // Set Sentry user context
            Sentry.setUser({ id: user.id.toString(), email: user.email });

            let team = undefined;
            let role: TenantRole | undefined = undefined;

            const teamResult = await db.query.teamMembers.findFirst({
                where: eq(teamMembers.userId, user.id),
                with: { team: true }
            });

            if (options.requireTeam !== false) {
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
            if (options.allowedRoles && options.allowedRoles.length > 0) {
                if (!role || !options.allowedRoles.includes(role)) {
                    console.warn(`⚠️ [Action ${actionName}] Forbidden: User ${user.id} with role ${role} tried to access action requiring [${options.allowedRoles.join(', ')}]`);
                    return error('Доступ запрещен', 'FORBIDDEN');
                }
            }

            // Execute handler
            const result = await handler({ user, team, role }, ...args);

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
