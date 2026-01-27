'use server';

import { and, eq, isNull, sql } from 'drizzle-orm';
import * as xlsx from 'xlsx';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db/drizzle';
import { materials, NewMaterial } from '@/lib/db/schema';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { MaterialRow } from '@/types/material-row';

const headerMap: Record<string, string> = {
    'Код': 'code',
    'Наименование': 'name',
    'Ед изм': 'unit',
    'Ед. изм.': 'unit',
    'Ед.изм.': 'unit',
    'Базовая цена': 'price',
    'Цена': 'price',
    'Поставщик': 'vendor',
    'Вес (кг)': 'weight',
    'Категория LV1': 'categoryLv1',
    'Категория LV2': 'categoryLv2',
    'Категория LV3': 'categoryLv3',
    'Категория LV4': 'categoryLv4',
    'URL товара': 'productUrl',
    'URL изображения': 'imageUrl',
    'Раздел': 'category',
    'Подраздел': 'subcategory',
    'Краткое описание': 'shortDescription',
    'Описание': 'description',
    // English defaults
    'code': 'code',
    'name': 'name',
    'unit': 'unit',
    'price': 'price',
    'vendor': 'vendor',
    'weight': 'weight',
    'categoryLv1': 'categoryLv1',
    'categoryLv2': 'categoryLv2',
    'categoryLv3': 'categoryLv3',
    'categoryLv4': 'categoryLv4',
    'productUrl': 'productUrl',
    'imageUrl': 'imageUrl',
};

const requiredFields = ['code', 'name', 'unit', 'price'];

export async function importMaterials(formData: FormData): Promise<{ success: boolean; message: string; count?: number }> {
    const user = await getUser();
    if (!user) return { success: false, message: 'Пользователь не найден.' };

    const team = await getTeamForUser();
    if (!team) return { success: false, message: 'Команда не найдена.' };

    console.log('--- Import Materials Started ---');
    console.log('FormData Keys:', Array.from(formData.keys()));
    const file = formData.get('file');
    console.log('File field value type:', typeof file);

    if (!file || !(file instanceof File)) {
        console.error('File missing or not a File object!');
        return { success: false, message: 'Файл не найден или имеет неверный формат.' };
    }
    try {
        const buffer = await file.arrayBuffer();
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Try to detect if it's a tab-separated file and help xlsx
        const data: Record<string, string | number>[] = xlsx.utils.sheet_to_json(sheet, {
            defval: '',
        });

        if (data.length === 0) return { success: false, message: 'Файл пуст или формат не распознан.' };

        const mappedData = data.map(row => {
            const newRow: Record<string, string | number | undefined> = {};
            Object.entries(row).forEach(([key, value]) => {
                const cleanedKey = key.trim().replace(/\s+/g, ' ');
                const mappedKey = headerMap[cleanedKey];
                if (mappedKey) newRow[mappedKey] = value;
            });
            return newRow;
        });

        if (mappedData.length > 0) {
            const firstRow = mappedData[0];
            const missingFields = requiredFields.filter(f => !Object.hasOwn(firstRow, f));
            if (missingFields.length > 0) {
                return {
                    success: false,
                    message: `Отсутствуют необходимые столбцы: ${missingFields.join(', ')}. Проверьте соответствие шапке.`,
                };
            }
        }

        const uniqueMaterialsMap = new Map<string, NewMaterial>();
        mappedData.forEach(row => {
            if (!row.code || !row.name) return;
            const code = String(row.code);
            const material: NewMaterial = {
                tenantId: team.id,
                code: code,
                name: String(row.name),
                unit: row.unit ? String(row.unit) : undefined,
                price: row.price ? Number(row.price) : undefined,
                vendor: row.vendor ? String(row.vendor) : undefined,
                weight: row.weight ? String(row.weight) : undefined,
                categoryLv1: row.categoryLv1 ? String(row.categoryLv1) : undefined,
                categoryLv2: row.categoryLv2 ? String(row.categoryLv2) : undefined,
                categoryLv3: row.categoryLv3 ? String(row.categoryLv3) : undefined,
                categoryLv4: row.categoryLv4 ? String(row.categoryLv4) : undefined,
                productUrl: row.productUrl ? String(row.productUrl) : undefined,
                imageUrl: row.imageUrl ? String(row.imageUrl) : undefined,
                category: row.category ? String(row.category) : undefined,
                subcategory: row.subcategory ? String(row.subcategory) : undefined,
                shortDescription: row.shortDescription ? String(row.shortDescription) : undefined,
                description: row.description ? String(row.description) : undefined,
                status: 'active',
            };
            uniqueMaterialsMap.set(code, material);
        });

        const newMaterials = Array.from(uniqueMaterialsMap.values());

        // IMPORTANT: Skip embeddings for bulk import to avoid timeouts (30s limit)
        // They should be generated in a background job later.

        const DB_BATCH_SIZE = 500;
        for (let i = 0; i < newMaterials.length; i += DB_BATCH_SIZE) {
            const batch = newMaterials.slice(i, i + DB_BATCH_SIZE);
            await db.insert(materials).values(batch)
                .onConflictDoUpdate({
                    target: [materials.tenantId, materials.code],
                    set: {
                        name: sql`excluded.name`,
                        unit: sql`excluded.unit`,
                        price: sql`excluded.price`,
                        vendor: sql`excluded.vendor`,
                        weight: sql`excluded.weight`,
                        categoryLv1: sql`excluded.category_lv1`,
                        categoryLv2: sql`excluded.category_lv2`,
                        categoryLv3: sql`excluded.category_lv3`,
                        categoryLv4: sql`excluded.category_lv4`,
                        productUrl: sql`excluded.product_url`,
                        imageUrl: sql`excluded.image_url`,
                        category: sql`excluded.category`,
                        subcategory: sql`excluded.subcategory`,
                        shortDescription: sql`excluded.short_description`,
                        description: sql`excluded.description`,
                        // embedding: sql`excluded.embedding`, // Keep old embedding if exists
                        updatedAt: new Date(),
                    }
                });
        }

        revalidatePath('/app/guide/materials');
        return {
            success: true,
            message: `Импорт завершен. Загружено записей: ${newMaterials.length}. Интеллектуальный поиск станет доступен после обработки данных ИИ.`,
            count: newMaterials.length
        };
    } catch (error) {
        console.error('Import materials error:', error);
        return { success: false, message: 'Ошибка при обработке файла.' };
    }
}

export async function exportMaterials(): Promise<{ success: boolean; data?: Record<string, unknown>[] }> {
    const team = await getTeamForUser();
    if (!team) return { success: false };

    try {
        const dbData = await db
            .select({
                'Код': materials.code,
                'Наименование': materials.name,
                'Ед изм': materials.unit,
                'Цена': materials.price,
                'Поставщик': materials.vendor,
                'Вес (кг)': materials.weight,
                'Категория LV1': materials.categoryLv1,
                'Категория LV2': materials.categoryLv2,
                'Категория LV3': materials.categoryLv3,
                'Категория LV4': materials.categoryLv4,
                'URL товара': materials.productUrl,
                'URL изображения': materials.imageUrl,
            })
            .from(materials)
            .where(and(eq(materials.tenantId, team.id), eq(materials.status, 'active'), isNull(materials.deletedAt)));
        return { success: true, data: dbData as unknown as Record<string, unknown>[] };
    } catch {
        return { success: false };
    }
}

export async function deleteMaterial(id: string): Promise<{ success: boolean; message: string }> {
    const team = await getTeamForUser();
    if (!team) return { success: false, message: 'Команда не найдена.' };

    try {
        await db.delete(materials).where(and(eq(materials.id, id), eq(materials.tenantId, team.id)));
        revalidatePath('/app/guide/materials');
        return { success: true, message: 'Успешно удалено.' };
    } catch {
        return { success: false, message: 'Ошибка удаления.' };
    }
}

export async function deleteAllMaterials(): Promise<{ success: boolean; message: string }> {
    const team = await getTeamForUser();
    if (!team) return { success: false, message: 'Команда не найдена.' };

    try {
        await db.delete(materials).where(eq(materials.tenantId, team.id));
        revalidatePath('/app/guide/materials');
        return { success: true, message: 'Справочник очищен.' };
    } catch {
        return { success: false, message: 'Ошибка очистки.' };
    }
}

export async function updateMaterial(id: string, data: Partial<NewMaterial>): Promise<{ success: boolean; message: string }> {
    const team = await getTeamForUser();
    if (!team) return { success: false, message: 'Команда не найдена.' };

    try {
        let embedding: number[] | null | undefined = undefined;
        if (data.name || data.category || data.subcategory || data.unit || data.vendor || data.categoryLv1) {
            const current = await db.query.materials.findFirst({
                where: and(eq(materials.id, id), eq(materials.tenantId, team.id))
            });
            if (current) {
                const text = `Материал: ${data.name ?? current.name}. Код: ${data.code ?? current.code}. Поставщик: ${data.vendor ?? current.vendor ?? '—'}. Категории: ${[data.categoryLv1 ?? current.categoryLv1, data.categoryLv2 ?? current.categoryLv2, data.categoryLv3 ?? current.categoryLv3, data.categoryLv4 ?? current.categoryLv4].filter(Boolean).join(' > ') || '—'}. Ед.изм: ${data.unit ?? current.unit ?? '—'}.`;
                embedding = await generateEmbedding(text);
            }
        }

        await db.update(materials).set({ ...data, ...(embedding !== undefined && { embedding }), updatedAt: new Date() })
            .where(and(eq(materials.id, id), eq(materials.tenantId, team.id)));
        revalidatePath('/app/guide/materials');
        return { success: true, message: 'Обновлено.' };
    } catch {
        return { success: false, message: 'Ошибка обновления.' };
    }
}

export async function createMaterial(data: NewMaterial): Promise<{ success: boolean; message: string }> {
    const team = await getTeamForUser();
    if (!team) return { success: false, message: 'Команда не найдена.' };

    try {
        const text = `Материал: ${data.name}. Код: ${data.code}. Поставщик: ${data.vendor || '—'}. Категории: ${[data.categoryLv1, data.categoryLv2, data.categoryLv3, data.categoryLv4].filter(Boolean).join(' > ') || '—'}. Ед.изм: ${data.unit || '—'}.`;
        const embedding = await generateEmbedding(text);
        await db.insert(materials).values({ ...data, tenantId: team.id, status: 'active', embedding });
        revalidatePath('/app/guide/materials');
        return { success: true, message: 'Добавлено.' };
    } catch {
        return { success: false, message: 'Ошибка добавления.' };
    }
}

export async function searchMaterials(query: string): Promise<{ success: boolean; data?: MaterialRow[]; message?: string }> {
    const team = await getTeamForUser();
    if (!team) return { success: false, message: 'Команда не найдена.' };

    if (!query || query.trim().length < 2) return { success: false, message: 'Короткий запрос.' };

    try {
        const queryEmbedding = await generateEmbedding(query);
        if (!queryEmbedding) return { success: false, message: 'Ошибка ИИ.' };

        const results = await db.select({
            id: materials.id,
            tenantId: materials.tenantId,
            code: materials.code,
            name: materials.name,
            unit: materials.unit,
            price: materials.price,
            vendor: materials.vendor,
            weight: materials.weight,
            categoryLv1: materials.categoryLv1,
            categoryLv2: materials.categoryLv2,
            categoryLv3: materials.categoryLv3,
            categoryLv4: materials.categoryLv4,
            productUrl: materials.productUrl,
            imageUrl: materials.imageUrl,
            category: materials.category,
            subcategory: materials.subcategory,
            shortDescription: materials.shortDescription,
            description: materials.description,
            status: materials.status,
            metadata: materials.metadata,
            tags: materials.tags,
            createdAt: materials.createdAt,
            updatedAt: materials.updatedAt,
            deletedAt: materials.deletedAt,
            similarity: sql<number>`1 - (${materials.embedding} <=> ${JSON.stringify(queryEmbedding)})`
        })
            .from(materials)
            .where(and(eq(materials.tenantId, team.id), isNull(materials.deletedAt), eq(materials.status, 'active')))
            .orderBy(sql`${materials.embedding} <=> ${JSON.stringify(queryEmbedding)}`)
            .limit(100);

        const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
        const finalData = results.map(row => {
            let boost = 0;
            const nameLower = (row.name || "").toLowerCase();
            queryTokens.forEach(token => { if (nameLower.includes(token)) boost += 0.25; });
            return { ...row, boostedScore: (row.similarity || 0) + boost };
        })
            .filter(r => (r.similarity || 0) > 0.25)
            .sort((a, b) => b.boostedScore - a.boostedScore);

        return { success: true, data: finalData as unknown as MaterialRow[] };
    } catch {
        return { success: false, message: 'Ошибка поиска.' };
    }
}
