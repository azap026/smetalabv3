import { defineConfig, devices } from '@playwright/test';

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });

export default defineConfig({
    testDir: './__tests__/e2e',
    timeout: 60000,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: process.env.CI ? process.env.BASE_URL : 'http://localhost:3000',
        trace: 'on-first-retry',
        viewport: { width: 1280, height: 720 },
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    // Run local dev server before starting the tests
    webServer: {
        command: 'pnpm dev:next',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        stdout: 'pipe',
        stderr: 'pipe',
        timeout: 120 * 1000,
    },
});
