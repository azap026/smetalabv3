'use server';

import { and, eq, isNull, or, sql } from 'drizzle-orm';
import * as xlsx from 'xlsx';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db/drizzle';
import { works, NewWork } from '@/lib/db/schema';
import { getUser, getTeamForUser } from '@/lib/db/queries';

const headerMap: Record<string, string> = {
    'Код': 'code',
    'Наименование': 'name',
    'Ед. изм.': 'unit',
    'Ед.изм.': 'unit',
    'Базовая цена': 'price',
    'Цена': 'price',
    'Этап': 'phase',
    'Этап№': 'phase',
    'Этап №': 'phase',
    'Этап № ': 'phase',
    'этап': 'phase',
    'фаза': 'phase',
    'Раздел': 'category',
    'Подраздел': 'subcategory',
    'Краткое описание': 'shortDescription',
    'Описание': 'description',
    // English defaults
    'code': 'code',
    'name': 'name',
    'unit': 'unit',
    'price': 'price',
    'phase': 'phase',
    'category': 'category',
    'subcategory': 'subcategory',
};

const requiredFields = ['code', 'name', 'unit', 'price'];

export async function importWorks(formData: FormData): Promise<{ success: boolean; message: string; count?: number }> {
    const user = await getUser();
    if (!user) {
        return { success: false, message: 'Пользователь не найден.' };
    }

    const team = await getTeamForUser();
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
        const data: Record<string, string | number>[] = xlsx.utils.sheet_to_json(sheet);

        if (data.length === 0) {
            return { success: false, message: 'Файл пуст.' };
        }

        console.log('Sample Excel Keys:', Object.keys(data[0]));

        // Map data keys based on headerMap
        const mappedData = data.map(row => {
            const newRow: Record<string, string | number | undefined> = {};
            Object.entries(row).forEach(([key, value]) => {
                const cleanedKey = key.trim();
                const mappedKey = headerMap[cleanedKey];
                if (mappedKey) {
                    newRow[mappedKey] = value;
                }
            });
            return newRow;
        });

        console.log('Mapped Sample Row:', mappedData[0]);

        // Check for required fields in the FIRST mapped row
        if (mappedData.length > 0) {
            const firstRow = mappedData[0];
            const missingFields = requiredFields.filter(f => !Object.hasOwn(firstRow, f));
            if (missingFields.length > 0) {
                return {
                    success: false,
                    message: `Отсутствуют необходимые столбцы: ${missingFields.join(', ')} (или заголовки не распознаны)`,
                };
            }
        }

        const uniqueWorksMap = new Map<string, NewWork>();
        mappedData.forEach(row => {
            const code = String(row.code);
            const work: NewWork = {
                tenantId: team.id,
                code: code,
                name: String(row.name),
                unit: row.unit ? String(row.unit) : undefined,
                price: row.price ? Number(row.price) : undefined,
                phase: row.phase ? String(row.phase) : undefined,
                category: row.category ? String(row.category) : undefined,
                subcategory: row.subcategory ? String(row.subcategory) : undefined,
                shortDescription: row.shortDescription ? String(row.shortDescription) : undefined,
                description: row.description ? String(row.description) : undefined,
                status: 'active',
            };
            // Use code as key (within tenant scope) to keep only the last occurrence in the file
            uniqueWorksMap.set(code, work);
        });

        const newWorks = Array.from(uniqueWorksMap.values());
        console.log('First Work to Insert:', newWorks[0]);

        // Bulk Upsert in a single query (Postgres supports this via Drizzle)
        await db.insert(works).values(newWorks)
            .onConflictDoUpdate({
                target: [works.tenantId, works.code],
                set: {
                    name: sql`excluded.name`,
                    unit: sql`excluded.unit`,
                    price: sql`excluded.price`,
                    phase: sql`excluded.phase`,
                    category: sql`excluded.category`,
                    subcategory: sql`excluded.subcategory`,
                    shortDescription: sql`excluded.short_description`,
                    description: sql`excluded.description`,
                    updatedAt: new Date(),
                }
            });

        revalidatePath('/app/guide/works');
        return {
            success: true,
            message: `Импорт успешно завершен. Обработано строк: ${newWorks.length}`,
            count: newWorks.length
        };

    } catch (error) {
        console.error('Import error:', error);
        return { success: false, message: 'Ошибка при обработке файла. Убедитесь, что формат файла правильный.' };
    }
}

export async function exportWorks(): Promise<{ success: boolean; message?: string; data?: Record<string, unknown>[] }> {
    const user = await getUser();
    if (!user) {
        return { success: false, message: 'Пользователь не найден.' };
    }

    const team = await getTeamForUser();
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
                phase: works.phase,
                category: works.category,
                subcategory: works.subcategory,
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

export async function deleteWork(id: string): Promise<{ success: boolean; message: string }> {
    const user = await getUser();
    if (!user) return { success: false, message: 'Пользователь не найден.' };

    const team = await getTeamForUser();
    if (!team) return { success: false, message: 'Команда не найдена.' };

    try {
        // 1. Get the work to know its phase
        const workToDelete = await db.query.works.findFirst({
            columns: { phase: true },
            where: and(eq(works.id, id), eq(works.tenantId, team.id))
        });

        if (!workToDelete) {
            return { success: false, message: 'Запись не найдена.' };
        }

        // 2. Delete the work
        await db.delete(works)
            .where(
                and(
                    eq(works.id, id),
                    eq(works.tenantId, team.id)
                )
            );

        // 3. Resequence the phase to close gaps (e.g. 1.1, 1.3 -> 1.1, 1.2)
        if (workToDelete.phase) {
            await resequencePhase(team.id, workToDelete.phase);
        }

        revalidatePath('/app/guide/works');
        return { success: true, message: 'Запись успешно удалена.' };
    } catch (error) {
        console.error('Delete work error:', error);
        return { success: false, message: 'Ошибка при удалении записи.' };
    }
}

export async function deleteAllWorks(): Promise<{ success: boolean; message: string }> {
    const user = await getUser();
    if (!user) return { success: false, message: 'Пользователь не найден.' };

    const team = await getTeamForUser();
    if (!team) return { success: false, message: 'Команда не найдена.' };

    try {
        await db.delete(works)
            .where(
                eq(works.tenantId, team.id)
            );

        revalidatePath('/app/guide/works');
        return { success: true, message: 'Справочник успешно очищен.' };
    } catch (error) {
        console.error('Delete all works error:', error);
        return { success: false, message: 'Ошибка при очистке справочника.' };
    }
}

export async function updateWork(id: string, data: Partial<NewWork>): Promise<{ success: boolean; message: string }> {
    const user = await getUser();
    if (!user) return { success: false, message: 'Пользователь не найден.' };

    const team = await getTeamForUser();
    if (!team) return { success: false, message: 'Команда не найдена.' };

    try {
        await db.update(works)
            .set({
                ...data,
                updatedAt: new Date()
            })
            .where(
                and(
                    eq(works.id, id),
                    eq(works.tenantId, team.id)
                )
            );

        revalidatePath('/app/guide/works');
        return { success: true, message: 'Запись успешно обновлена.' };
    } catch (error) {
        console.error('Update work error:', error);
        return { success: false, message: 'Ошибка при обновлении записи.' };
    }
}

export async function createWork(data: NewWork): Promise<{ success: boolean; message: string }> {
    const user = await getUser();
    if (!user) return { success: false, message: 'Пользователь не найден.' };

    const team = await getTeamForUser();
    if (!team) return { success: false, message: 'Команда не найдена.' };

    try {
        await db.insert(works).values({
            ...data,
            tenantId: team.id,
            status: 'active',
        });

        revalidatePath('/app/guide/works');
        return { success: true, message: 'Запись успешно добавлена.' };
    } catch (error) {
        console.error('Create work error:', error);
        return { success: false, message: 'Ошибка при добавлении записи.' };
    }
}

export async function reorderWorks(): Promise<{ success: boolean; message: string }> {
    const user = await getUser();
    if (!user) return { success: false, message: 'Пользователь не найден.' };

    const team = await getTeamForUser();
    if (!team) return { success: false, message: 'Команда не найдена.' };

    try {
        const allWorks = await db
            .select()
            .from(works)
            .where(
                and(
                    eq(works.tenantId, team.id),
                    isNull(works.deletedAt)
                )
            );

        if (allWorks.length === 0) {
            return { success: false, message: 'Нет данных для упорядочивания.' };
        }

        // Helper to extract numeric segments for logical sorting (e.g. 1.10 > 1.2)
        const getSegments = (code: string) => code.split('.').map(segment => parseInt(segment, 10) || 0);

        // Group works by phase
        const grouped = allWorks.reduce((acc, work) => {
            const phaseStr = work.phase || "0";
            if (!acc[phaseStr]) acc[phaseStr] = [];
            acc[phaseStr].push(work);
            return acc;
        }, {} as Record<string, typeof allWorks>);

        const toUpdate: { id: string; newCode: string }[] = [];

        // For each phase, sort by current code and re-index
        Object.entries(grouped).forEach(([phaseName, phaseWorks]) => {
            // Sort works within this phase
            phaseWorks.sort((a, b) => {
                const segA = getSegments(a.code);
                const segB = getSegments(b.code);
                for (let i = 0; i < Math.max(segA.length, segB.length); i++) {
                    const valA = segA[i] || 0;
                    const valB = segB[i] || 0;
                    if (valA !== valB) return valA - valB;
                }
                return 0;
            });

            // Extract phase number (e.g. "Этап 1" -> 1)
            const phaseDigits = phaseName.match(/\d+/);
            const phasePrefix = phaseDigits ? phaseDigits[0] : "0";

            // Re-assign codes: 1.1, 1.2, 1.3...
            phaseWorks.forEach((work, index) => {
                const newCode = `${phasePrefix}.${index + 1}`;
                if (work.code !== newCode) {
                    toUpdate.push({ id: work.id, newCode });
                }
            });
        });

        if (toUpdate.length > 0) {
            await db.transaction(async (tx) => {
                // 1. Set to temp codes to avoid unique constraint violations
                for (const item of toUpdate) {
                    await tx.update(works)
                        .set({ code: `TMP-${item.id}-${Math.random().toString(36).substring(7)}` })
                        .where(eq(works.id, item.id));
                }
                // 2. Set to final codes
                for (const item of toUpdate) {
                    await tx.update(works)
                        .set({ code: item.newCode, updatedAt: new Date() })
                        .where(eq(works.id, item.id));
                }
            });
        }

        revalidatePath('/app/guide/works');
        return { success: true, message: `Перенумерация завершена. Обновлено записей: ${toUpdate.length}` };

    } catch (error) {
        console.error('Reorder works error:', error);
        return { success: false, message: 'Ошибка при перенумерации справочника.' };
    }
}

export async function getUniqueUnits(): Promise<string[]> {
    const team = await getTeamForUser();
    if (!team) return [];

    const result = await db
        .selectDistinct({ unit: works.unit })
        .from(works)
        .where(
            and(
                eq(works.tenantId, team.id),
                isNull(works.deletedAt),
                sql`${works.unit} IS NOT NULL`
            )
        );

    return result.map(r => r.unit!).filter(Boolean).sort();
}

export async function insertWorkAfter(afterId: string | null, data: NewWork): Promise<{ success: boolean; message: string }> {
    const user = await getUser();
    if (!user) return { success: false, message: 'Пользователь не найден.' };

    const team = await getTeamForUser();
    if (!team) return { success: false, message: 'Команда не найдена.' };

    try {
        let targetPhase = "Этап 1";
        let tempCode = `1.${Date.now()}`;

        if (afterId) {
            // 1. Get the target work to know its phase and code
            const target = await db.query.works.findFirst({
                where: and(eq(works.id, afterId), eq(works.tenantId, team.id))
            });

            if (!target) return { success: false, message: 'Запись для вставки не найдена.' };

            targetPhase = target.phase || "Этап 1";
            tempCode = `${target.code}.${Date.now()}`;
        } else {
            // Inserting safely into empty table or at the end if no anchor provided
            // Find the last work to determine phase if possible, otherwise defaults
            const lastWork = await db.query.works.findFirst({
                where: and(eq(works.tenantId, team.id), isNull(works.deletedAt)),
                orderBy: (works, { desc }) => [desc(works.createdAt)] // simple heuristic, reorderWorks will fix
            });

            if (lastWork) {
                targetPhase = lastWork.phase || "Этап 1";
                tempCode = `${lastWork.code}.${Date.now()}`;
            }
        }

        await db.insert(works).values({
            ...data,
            tenantId: team.id,
            code: tempCode,
            phase: targetPhase,
            status: 'active',
        });

        // 3. Immediately resequence ONLY the affected phase to fix codes
        await resequencePhase(team.id, targetPhase);

        revalidatePath('/app/guide/works');
        return {
            success: true,
            message: 'Запись успешно добавлена.'
        };
    } catch (error) {
        console.error('Insert work error:', error);
        return { success: false, message: 'Ошибка при вставке записи.' };
    }
}

async function resequencePhase(teamId: number, phaseName: string) {
    const phaseWorks = await db
        .select()
        .from(works)
        .where(
            and(
                eq(works.tenantId, teamId),
                eq(works.phase, phaseName),
                isNull(works.deletedAt)
            )
        );

    // Helpers
    const getSegments = (code: string) => code.split('.').map(segment => parseInt(segment, 10) || 0);
    const phaseDigits = phaseName.match(/\d+/);
    const phasePrefix = phaseDigits ? phaseDigits[0] : "0";

    // Sort: primarily by existing code segments, but carefully handle specific patterns
    phaseWorks.sort((a, b) => {
        // If one has a timestamp suffix (3+ segments) and the other doesn't,
        // we need to be smart?
        // Actually, just parsing segments helps, but 1.1.999999 comes after 1.1
        // We expect logical sort.
        const segA = getSegments(a.code);
        const segB = getSegments(b.code);

        // Compare segment by segment
        const len = Math.max(segA.length, segB.length);
        for (let i = 0; i < len; i++) {
            const valA = segA[i] || 0;
            const valB = segB[i] || 0;
            if (valA !== valB) return valA - valB;
        }
        return 0; // Equal? should not happen usually
    });

    const toUpdate: { id: string; newCode: string }[] = [];

    // Re-assign: 1.1, 1.2, 1.3...
    phaseWorks.forEach((work, index) => {
        const newCode = `${phasePrefix}.${index + 1}`;
        if (work.code !== newCode) {
            toUpdate.push({ id: work.id, newCode });
        }
    });

    if (toUpdate.length > 0) {
        // Efficient Batch Update using SQL
        await db.transaction(async (tx) => {
            // 1. Batch update to Temp codes
            const tempUpdates = toUpdate.map(item => ({
                id: item.id,
                code: `TMP-${item.id}-${Math.floor(Math.random() * 10000)}`
            }));

            // Construct CASE statement for Temp Code Update
            // UPDATE works SET code = CASE id WHEN ... END WHERE id IN (...)
            const tempCase = sql`CASE ${sql.join(
                tempUpdates.map(u => sql`WHEN id = ${u.id} THEN ${u.code}`),
                sql` `
            )} END`;

            await tx.update(works)
                .set({ code: tempCase })
                .where(
                    sql`id IN ${tempUpdates.map(u => u.id)}`
                );

            // 2. Batch update to Final codes
            const finalCase = sql`CASE ${sql.join(
                toUpdate.map(u => sql`WHEN id = ${u.id} THEN ${u.newCode}`),
                sql` `
            )} END`;

            await tx.update(works)
                .set({ code: finalCase, updatedAt: new Date() })
                .where(
                    sql`id IN ${toUpdate.map(u => u.id)}`
                );
        });
    }
}
