import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        alias: {
            '@': path.resolve(__dirname, './'),
        },
        include: ['__tests__/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['node_modules/**/*'],
        setupFiles: ['./vitest.setup.ts'],
    },
});
