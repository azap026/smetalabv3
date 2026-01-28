'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/drizzle';
import { materials, NewMaterial } from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { MaterialsService } from '@/lib/services/materials.service';
import { safeAction } from '@/lib/actions/safe-action';
import { ExcelService } from '@/lib/services/excel.service';
import { success, error } from '@/lib/utils/result';
import { materialsHeaderMap, materialsRequiredFields } from '@/lib/constants/import-configs';


export const importMaterials = safeAction(async ({ team }, formData: FormData) => {
    const file = formData.get('file') as File;
    if (!file) return error('Ошибка передачи файла');

    const buffer = Buffer.from(await file.arrayBuffer());
    const parseResult = await ExcelService.parseBuffer<Record<string, unknown>>(buffer, {
        headerMap: materialsHeaderMap,
        requiredFields: materialsRequiredFields
    });

    if (!parseResult.success) return parseResult;

    const materialsToUpsert: NewMaterial[] = parseResult.data.map(row => ({
        tenantId: team.id,
        code: String(row.code),
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
        description: row.description ? String(row.description) : undefined,
        status: 'active',
    }));

    const result = await MaterialsService.upsertMany(team.id, materialsToUpsert);
    if (result.success) {
        revalidatePath('/app/guide/materials');
        return success(undefined, `Импорт завершен. Загружено записей: ${materialsToUpsert.length}`);
    }
    return result;
});

export const exportMaterials = safeAction(async ({ team }) => {
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
            'Описание': materials.description,
        })
        .from(materials)
        .where(and(eq(materials.tenantId, team.id), eq(materials.status, 'active'), isNull(materials.deletedAt)));

    return success(dbData);
});
