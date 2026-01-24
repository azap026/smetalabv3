import { describe, it, expect } from 'vitest';
import { hashPassword, comparePasswords } from '@/lib/auth/session';

describe('Auth Session Utility', () => {
    it('should hash and compare passwords correctly', async () => {
        const password = 'mysecretpassword';
        const hashed = await hashPassword(password);

        expect(hashed).not.toBe(password);

        const isMatch = await comparePasswords(password, hashed);
        expect(isMatch).toBe(true);

        const isNotMatch = await comparePasswords('wrongpassword', hashed);
        expect(isNotMatch).toBe(false);
    });
});
