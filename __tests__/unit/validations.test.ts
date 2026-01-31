
import { describe, it, expect } from 'vitest';
import { workSchema, materialSchema } from '@/lib/validations/schemas';

describe('Validation Schemas', () => {
    describe('workSchema', () => {
        it('should validate valid work data', () => {
            const data = {
                name: 'Valid Work',
                unit: 'm2',
                price: 100,
                status: 'active' as const
            };
            const result = workSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should fail if name is empty', () => {
            const data = { name: '', unit: 'pcs' };
            const result = workSchema.safeParse(data);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Наименование обязательно');
            }
        });

        it('should fail if status is invalid', () => {
            const data = { name: 'Work', status: 'invalid-status' };
            const result = workSchema.safeParse(data);
            expect(result.success).toBe(false);
        });
    });

    describe('materialSchema', () => {
        it('should validate valid material data', () => {
            const data = {
                code: 'M-001',
                name: 'Material Name',
                unit: 'kg',
                price: 50.5,
                status: 'active' as const
            };
            const result = materialSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should fail if code is missing', () => {
            const data = { name: 'No Code' };
            const result = materialSchema.safeParse(data);
            expect(result.success).toBe(false);
        });
    });
});
