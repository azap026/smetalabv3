
import { describe, it, expect } from 'vitest';
import { buildMaterialContext, buildWorkContext } from './embedding-context';

describe('Embedding Context Builders', () => {
    describe('buildMaterialContext', () => {
        it('should build full context', () => {
            const result = buildMaterialContext({
                name: 'Material A',
                code: 'M-001',
                vendor: 'Vendor X',
                unit: 'kg',
                weight: '10',
                description: 'A great material',
                categoryLv1: 'Cat1',
                categoryLv2: 'Cat2',
                categoryLv3: 'Cat3',
                categoryLv4: 'Cat4'
            });
            expect(result).toBe('Категория: Cat1 > Cat2 > Cat3 > Cat4 | Материал: Material A | Код: M-001 | Поставщик: Vendor X | Ед.изм: kg | Вес: 10 | Описание: A great material');
        });

        it('should handle partial context', () => {
            const result = buildMaterialContext({
                name: 'Material B',
                code: 'M-002'
            });
            expect(result).toBe('Материал: Material B | Код: M-002');
        });

        it('should handle missing code', () => {
            const result = buildMaterialContext({
                name: 'Material C',
                code: ''
            });
            expect(result).toBe('Материал: Material C');
        });
    });

    describe('buildWorkContext', () => {
        it('should build full context', () => {
             const result = buildWorkContext({
                 name: 'Work A',
                 code: 'W-001',
                 unit: 'm2',
                 category: 'Cat A',
                 subcategory: 'Sub B',
                 phase: 'Phase 1',
                 description: 'Desc',
                 shortDescription: 'Short'
             });
             expect(result).toBe('Этап: Phase 1 | Раздел: Cat A | Подраздел: Sub B | Работа: Work A | Код: W-001 | Ед.изм: m2 | Краткое описание: Short | Описание: Desc');
        });

        it('should handle partial context', () => {
            const result = buildWorkContext({
                name: 'Work B'
            });
            expect(result).toBe('Работа: Work B');
        });
    });
});
