import { vi, describe, it, expect, beforeEach } from 'vitest';
import { importWorks, exportWorks } from '../../app/(workspace)/app/guide/works/actions';
import { db } from '../../lib/db/drizzle';
import { getUser } from '../../lib/auth/user';
import { getTeamForUser } from '../../lib/db/queries';
import { revalidatePath } from 'next/cache';
import * as xlsx from 'xlsx';

// Mock dependencies
vi.mock('../../lib/auth/user');
vi.mock('../../lib/db/queries');
vi.mock('../../lib/db/drizzle', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
        transaction: vi.fn(async (callback) => callback(
            {
                insert: vi.fn().mockReturnThis(),
                values: vi.fn().mockReturnThis(),
                onConflictDoUpdate: vi.fn().mockResolvedValue(null)
            }
        )),
    },
}));
vi.mock('next/cache');
vi.mock('xlsx');

const mockUser = { id: 1, name: 'Test User', email: 'test@test.com' };
const mockTeam = { id: 1, name: 'Test Team' };

describe('Works Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getUser).mockResolvedValue(mockUser as any);
        vi.mocked(getTeamForUser).mockResolvedValue(mockTeam as any);
    });

    describe('exportWorks', () => {
        it('should return exported data successfully', async () => {
            const mockWorksData = [{ code: '001', name: 'Test Work', unit: 'pc', price: 100 }];
            vi.mocked(db.where).mockResolvedValue(mockWorksData);

            const result = await exportWorks();

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockWorksData);
            expect(db.where).toHaveBeenCalledTimes(1);
        });

        it('should return an error if no user is found', async () => {
            vi.mocked(getUser).mockResolvedValue(null);
            const result = await exportWorks();
            expect(result.success).toBe(false);
            expect(result.message).toBe('Пользователь не найден.');
        });

        it('should return an error if no team is found', async () => {
            vi.mocked(getTeamForUser).mockResolvedValue(null);
            const result = await exportWorks();
            expect(result.success).toBe(false);
            expect(result.message).toBe('Команда не найдена.');
        });

        it('should return a message if there is no data to export', async () => {
            vi.mocked(db.where).mockResolvedValue([]);
            const result = await exportWorks();
            expect(result.success).toBe(false);
            expect(result.message).toBe('Нет данных для экспорта.');
        });
    });

    describe('importWorks', () => {
        const mockFileData = [{ code: '002', name: 'Imported Work', unit: 'm2', price: 250 }];
        const mockBuffer = Buffer.from('test data');
        const mockFile = new File([mockBuffer], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const mockFormData = new FormData();
        mockFormData.append('file', mockFile);

        beforeEach(() => {
            vi.mocked(xlsx.read).mockReturnValue({
                SheetNames: ['Sheet1'],
                Sheets: { 'Sheet1': {} }
            } as any);
            vi.mocked(xlsx.utils.sheet_to_json).mockReturnValue(mockFileData);
        });

        it('should import works successfully', async () => {
            const result = await importWorks(mockFormData);

            expect(result.success).toBe(true);
            expect(result.message).toBe('Импорт успешно завершен.');
            expect(db.transaction).toHaveBeenCalledTimes(1);
            expect(revalidatePath).toHaveBeenCalledWith('/app/guide/works');
        });

        it('should return an error if file is empty', async () => {
            vi.mocked(xlsx.utils.sheet_to_json).mockReturnValue([]);
            const result = await importWorks(mockFormData);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Файл пуст.');
        });

        it('should return an error for missing required headers', async () => {
            vi.mocked(xlsx.utils.sheet_to_json).mockReturnValue([ { name: 'Only name' } ]);
            const result = await importWorks(mockFormData);
            expect(result.success).toBe(false);
            expect(result.message).toContain('Отсутствуют необходимые столбцы');
        });

        it('should return an error if no user is found', async () => {
            vi.mocked(getUser).mockResolvedValue(null);
            const result = await importWorks(mockFormData);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Пользователь не найден.');
        });
    });
});
