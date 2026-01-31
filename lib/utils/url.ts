export function getBaseUrl() {
    if (process.env.BASE_URL) {
        return process.env.BASE_URL;
    }

    if (process.env.RENDER_EXTERNAL_URL) {
        return process.env.RENDER_EXTERNAL_URL;
    }

    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    return 'http://localhost:3000';
}
