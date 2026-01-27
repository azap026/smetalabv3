import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import * as xlsx from 'xlsx';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db/drizzle';
import { materials, NewMaterial } from '@/lib/db/schema';
import { getUser, getTeamForUser } from '@/lib/db/queries';

// Header mapping configuration
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

function parsePrice(value: unknown): number | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') return value;
    const str = String(value).trim().replace(',', '.').replace(/\s/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? undefined : num;
}

export const config = {
    api: {
        bodyParser: false, // We handle parsing manually if needed, but for App Router formData() this is less relevant, yet good practice for raw streams
    },
};

export async function POST(request: NextRequest) {
    try {
        console.log('--- Import Materials API Route Started ---');

        const user = await getUser();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Пользователь не найден.' }, { status: 401 });
        }

        const team = await getTeamForUser();
        if (!team) {
            return NextResponse.json({ success: false, message: 'Команда не найдена.' }, { status: 404 });
        }

        // Parse FormData from the request
        const formData = await request.formData();
        const file = formData.get('file');

        console.log('Received payload type:', file ? typeof file : 'null');
        if (file && typeof file === 'object' && 'name' in file) {
            console.log(`File details: name=${(file as File).name}, size=${(file as File).size}, type=${(file as File).type}`);
        }

        if (!file || !(file instanceof File)) {
            console.error('API ERROR: File object is missing in FormData.');
            return NextResponse.json({ success: false, message: 'Файл не найден или имеет неверный формат.' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Try to detect if it's a tab-separated file and help xlsx
        const data: Record<string, string | number>[] = xlsx.utils.sheet_to_json(sheet, {
            defval: '',
        });

        if (data.length === 0) {
            return NextResponse.json({ success: false, message: 'Файл пуст или формат не распознан.' }, { status: 400 });
        }

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
                return NextResponse.json({
                    success: false,
                    message: `Отсутствуют необходимые столбцы: ${missingFields.join(', ')}. Проверьте соответствие шапке.`,
                }, { status: 400 });
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
                price: row.price ? parsePrice(row.price) : undefined,
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

        // IMPORTANT: Skip embeddings for bulk import to avoid timeouts

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

        return NextResponse.json({
            success: true,
            message: `Импорт завершен. Загружено записей: ${newMaterials.length}. Интеллектуальный поиск станет доступен после обработки данных ИИ.`,
            count: newMaterials.length
        });

    } catch (error) {
        console.error('Import materials API error:', error);
        return NextResponse.json({ success: false, message: 'Ошибка при обработке файла.' }, { status: 500 });
    }
}
