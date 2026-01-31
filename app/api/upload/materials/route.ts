import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { MaterialsService } from '@/lib/services/materials.service';
import { ExcelService } from '@/lib/services/excel.service';
import { NewMaterial } from '@/lib/db/schema';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { materialsHeaderMap, materialsRequiredFields } from '@/lib/constants/import-configs';


export async function POST(request: NextRequest) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ success: false, message: 'Пользователь не найден.' }, { status: 401 });

        const team = await getTeamForUser();
        if (!team) return NextResponse.json({ success: false, message: 'Команда не найдена.' }, { status: 404 });

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) return NextResponse.json({ success: false, message: 'Файл не найден' }, { status: 400 });

        const buffer = Buffer.from(await file.arrayBuffer());
        const parseResult = await ExcelService.parseBuffer<Record<string, unknown>>(buffer, {
            headerMap: materialsHeaderMap,
            requiredFields: materialsRequiredFields
        });

        if (!parseResult.success) {
            return NextResponse.json(parseResult, { status: 400 });
        }

        const newMaterials: NewMaterial[] = parseResult.data.map(row => ({
            tenantId: team.id,
            code: String(row.code || ''),
            name: String(row.name || ''),
            unit: row.unit ? String(row.unit) : undefined,
            price: row.price ? Math.round(parseFloat(String(row.price).replace(',', '.').replace(/\s/g, ''))) : undefined,
            vendor: row.vendor ? String(row.vendor) : undefined,
            weight: row.weight ? String(row.weight) : undefined,
            categoryLv1: row.categoryLv1 ? String(row.categoryLv1) : undefined,
            categoryLv2: row.categoryLv2 ? String(row.categoryLv2) : undefined,
            categoryLv3: row.categoryLv3 ? String(row.categoryLv3) : undefined,
            categoryLv4: row.categoryLv4 ? String(row.categoryLv4) : undefined,
            productUrl: row.productUrl ? String(row.productUrl) : undefined,
            imageUrl: row.imageUrl ? String(row.imageUrl) : undefined,
            description: row.description ? String(row.description) : undefined,
            status: 'active'
        }));

        const result = await MaterialsService.upsertMany(team.id, newMaterials);

        if (result.success) {
            revalidatePath('/app/guide/materials');
            return NextResponse.json({
                success: true,
                message: `Импорт завершен. Загружено записей: ${newMaterials.length}.`,
                count: newMaterials.length
            });
        }

        return NextResponse.json(result, { status: 500 });

    } catch (error) {
        console.error('Import materials API error:', error);
        return NextResponse.json({ success: false, message: 'Ошибка при обработке файла.' }, { status: 500 });
    }
}
