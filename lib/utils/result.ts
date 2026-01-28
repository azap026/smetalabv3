export type ActionError = {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
};

export type Result<T> =
    | { success: true; data: T; message?: string }
    | { success: false; error: ActionError; message?: string };

export function success<T>(data: T, message?: string): Result<T> {
    return { success: true, data, message };
}

export function error(message: string, code?: string, details?: Record<string, unknown>): Result<never> {
    return { success: false, error: { message, code, details }, message };
}
