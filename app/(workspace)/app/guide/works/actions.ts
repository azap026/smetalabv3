'use server';

import { z } from 'zod';
import { and, eq, isNull, or } from 'drizzle-orm';
import * as xlsx from 'xlsx';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db/drizzle';
import { works, NewWork } from '@/lib/db/schema';
import { getUser } from '@/lib/auth/user';
import { getTeamForUser } from '@/lib/db/queries';

const requiredHeaders = ['code', 'name', 'unit', 'price'];

export async function importWorks(formData: FormData): Promise<{ success: boolean; message: string }> {
    const user = await getUser();
    if (!user) {
        return { success: false, message: 'Пользователь не найден.' };
    }

    const team = await getTeamForUser(user.id);
    if (!team) {
        return { success: false, message: 'Команда не найдена.' };
    }

    const file = formData.get('file') as File;
    if (!file) {
        return { success: false, message: 'Файл не найден.' };
    }

    try {
        const buffer = await file.arrayBuffer();
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet) as Record<string, any>[];

        if (data.length === 0) {
            return { success: false, message: 'Файл пуст.' };
        }

        const headers = Object.keys(data[0]);
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
            return {
                success: false,
                message: `Отсутствуют необходимые столбцы: ${missingHeaders.join(', ')}`,
            };
        }

        const newWorks: NewWork[] = data.map(row => ({
            tenantId: team.id,
            code: String(row.code),
            name: String(row.name),
            unit: row.unit ? String(row.unit) : undefined,
            price: row.price ? Number(row.price) : undefined,
            shortDescription: row.shortDescription ? String(row.shortDescription) : undefined,
            description: row.description ? String(row.description) : undefined,
            status: 'active',
        }));

        await db.transaction(async (tx) => {
            for (const work of newWorks) {
                await tx.insert(works).values(work)
                    .onConflictDoUpdate({
                        target: [works.tenantId, works.code],
                        set: {
                            name: work.name,
                            unit: work.unit,
                            price: work.price,
                            shortDescription: work.shortDescription,
                            description: work.description,
                            updatedAt: new Date(),
                        }
                    });
            }
        });

        revalidatePath('/app/guide/works');
        return { success: true, message: 'Импорт успешно завершен.' };

    } catch (error) {
        console.error('Import error:', error);
        return { success: false, message: 'Ошибка при обработке файла. Убедитесь, что формат файла правильный.' };
    }
}

export async function exportWorks(): Promise<{ success: boolean; message?: string; data?: any[] }> {
    const user = await getUser();
    if (!user) {
        return { success: false, message: 'Пользователь не найден.' };
    }

    const team = await getTeamForUser(user.id);
    if (!team) {
        return { success: false, message: 'Команда не найдена.' };
    }

    try {
        const worksData = await db
            .select({
                code: works.code,
                name: works.name,
                unit: works.unit,
                price: works.price,
                shortDescription: works.shortDescription,
                description: works.description,
            })
            .from(works)
            .where(
                and(
                    or(
                        isNull(works.tenantId),
                        eq(works.tenantId, team.id)
                    ),
                    eq(works.status, 'active'),
                    isNull(works.deletedAt)
                )
            );

        if (worksData.length === 0) {
            return { success: false, message: 'Нет данных для экспорта.' };
        }

        return { success: true, data: worksData };

    } catch (error) {
        console.error('Export error:', error);
        return { success: false, message: 'Произошла ошибка при экспорте данных.' };
    }
}
