import { and, eq, isNull, ilike, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { materials, NewMaterial } from '@/lib/db/schema';
import { generateEmbedding, generateEmbeddingsBatch } from '@/lib/ai/embeddings';
import { buildMaterialContext } from '@/lib/ai/embedding-context';
import { MaterialRow } from '@/types/material-row';
import { Result, success, error } from '@/lib/utils/result';
import { materialSchema } from '@/lib/validations/schemas';
import { withActiveTenant } from '@/lib/db/queries';

export class MaterialsService {
    static async getMany(teamId: number | null, limit?: number, search?: string): Promise<Result<MaterialRow[]>> {
        try {
            const filters = [withActiveTenant(materials, teamId)];

            if (search) {
                filters.push(ilike(materials.name, `%${search}%`));
            }

            const finalLimit = limit || (search ? 500 : 1000);

            const data = await db
                .select()
                .from(materials)
                .where(and(...filters))
                .orderBy(materials.code)
                .limit(finalLimit) as MaterialRow[];

            return success(data);
        } catch (e) {
            console.error('getManyMaterials error:', e);
            return error('Ошибка при получении материалов');
        }
    }

    static async create(teamId: number, rawData: NewMaterial): Promise<Result<void>> {
        const validation = materialSchema.safeParse(rawData);
        if (!validation.success) return error('Ошибка валидации: ' + validation.error.message);
        const data = validation.data;

        try {
            const embedding = await generateEmbedding(buildMaterialContext(data as NewMaterial));
            await db.insert(materials).values({
                ...data,
                tenantId: teamId,
                status: 'active',
                embedding
            });
            return success(undefined, 'Материал добавлен');
        } catch (e) {
            console.error('createMaterial error:', e);
            return error('Ошибка добавления');
        }
    }

    static async update(teamId: number, id: string, rawData: Partial<NewMaterial>): Promise<Result<void>> {
        // For updates, we don't strictly validate the whole object, but we could
        try {
            let embedding: number[] | null | undefined = undefined;

            if (rawData.name || rawData.unit || rawData.vendor || rawData.categoryLv1 || rawData.description || rawData.code) {
                const current = await db.query.materials.findFirst({
                    where: and(eq(materials.id, id), eq(materials.tenantId, teamId))
                });

                if (current) {
                    const contextData = {
                        name: rawData.name ?? current.name,
                        code: rawData.code ?? current.code,
                        description: rawData.description ?? current.description,
                        categoryLv1: rawData.categoryLv1 ?? current.categoryLv1,
                        categoryLv2: rawData.categoryLv2 ?? current.categoryLv2,
                        categoryLv3: rawData.categoryLv3 ?? current.categoryLv3,
                        categoryLv4: rawData.categoryLv4 ?? current.categoryLv4,
                        vendor: rawData.vendor ?? current.vendor,
                        unit: rawData.unit ?? current.unit,
                        weight: rawData.weight ?? current.weight
                    };
                    embedding = await generateEmbedding(buildMaterialContext(contextData as NewMaterial));
                }
            }

            await db.update(materials)
                .set({ ...rawData, ...(embedding !== undefined && { embedding }), updatedAt: new Date() })
                .where(and(eq(materials.id, id), eq(materials.tenantId, teamId)));

            return success(undefined, 'Обновлено');
        } catch (e) {
            console.error('updateMaterial error:', e);
            return error('Ошибка обновления');
        }
    }

    static async delete(teamId: number, id: string): Promise<Result<void>> {
        try {
            await db.delete(materials).where(and(eq(materials.id, id), eq(materials.tenantId, teamId)));
            return success(undefined, 'Успешно удалено');
        } catch (e) {
            console.error('deleteMaterial error:', e);
            return error('Ошибка удаления');
        }
    }

    static async deleteAll(teamId: number): Promise<Result<void>> {
        try {
            await db.delete(materials).where(eq(materials.tenantId, teamId));
            return success(undefined, 'Справочник очищен');
        } catch (e) {
            console.error('deleteAllMaterials error:', e);
            return error('Ошибка очистки');
        }
    }

    static async search(teamId: number, query: string): Promise<Result<MaterialRow[]>> {
        if (!query || query.trim().length < 2) return error('Короткий запрос');

        try {
            const queryEmbedding = await generateEmbedding(query);
            if (!queryEmbedding) return error('Ошибка ИИ');

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
                description: materials.description,
                status: materials.status,
                metadata: materials.metadata,
                tags: materials.tags,
                createdAt: materials.createdAt,
                updatedAt: materials.updatedAt,
                deletedAt: materials.deletedAt,
                similarity: sql<number>`1 - (${materials.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`
            })
                .from(materials)
                .where(and(
                    withActiveTenant(materials, teamId),
                    eq(materials.status, 'active'),
                    sql`${materials.embedding} IS NOT NULL`
                ))
                .orderBy(sql`${materials.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector`)
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

            return success(finalData as unknown as MaterialRow[]);
        } catch (e) {
            console.error('searchMaterials error:', e);
            return error('Ошибка поиска');
        }
    }

    static async upsertMany(teamId: number, data: NewMaterial[]): Promise<Result<void>> {
        try {
            await db.transaction(async (tx) => {
                const DB_BATCH_SIZE = 500;

                for (let i = 0; i < data.length; i += DB_BATCH_SIZE) {
                    const batch = data.slice(i, i + DB_BATCH_SIZE);

                    await tx.insert(materials).values(batch)
                        .onConflictDoUpdate({
                            target: [materials.tenantId, materials.code],
                            set: {
                                name: sql`excluded.name`,
                                unit: sql`excluded.unit`,
                                price: sql`excluded.price`,
                                vendor: sql`excluded.vendor`,
                                weight: sql`excluded.weight`,
                                categoryLv1: sql`excluded.category_lv_1`,
                                categoryLv2: sql`excluded.category_lv_2`,
                                categoryLv3: sql`excluded.category_lv_3`,
                                categoryLv4: sql`excluded.category_lv_4`,
                                productUrl: sql`excluded.product_url`,
                                imageUrl: sql`excluded.image_url`,
                                description: sql`excluded.description`,
                                updatedAt: new Date(),
                            }
                        });
                }
            });
            return success(undefined);
        } catch (e) {
            console.error('upsertManyMaterials error:', e);
            return error('Ошибка при сохранении данных', 'TRANSACTION_FAILED');
        }
    }

    static async generateMissingEmbeddings(teamId: number): Promise<Result<{ processed: number; remaining: number }>> {
        try {
            const BATCH_SIZE = 50;
            const materialsWithoutEmbedding = await db
                .select()
                .from(materials)
                .where(and(eq(materials.tenantId, teamId), isNull(materials.embedding)))
                .limit(BATCH_SIZE);

            if (materialsWithoutEmbedding.length === 0) {
                return success({ processed: 0, remaining: 0 });
            }

            const contexts = materialsWithoutEmbedding.map(m => buildMaterialContext(m as NewMaterial));
            const embeddings = await generateEmbeddingsBatch(contexts);

            if (embeddings && embeddings.length === materialsWithoutEmbedding.length) {
                // Update in batches or individually? Individual updates are safer for embeddings but slower.
                // Using a transaction for batch update
                await db.transaction(async (tx) => {
                    for (let i = 0; i < materialsWithoutEmbedding.length; i++) {
                        await tx.update(materials)
                            .set({ embedding: embeddings[i] })
                            .where(eq(materials.id, materialsWithoutEmbedding[i].id));
                    }
                });
            }

            const [{ count }] = await db
                .select({ count: sql<number>`count(*)` })
                .from(materials)
                .where(and(eq(materials.tenantId, teamId), isNull(materials.embedding)));

            return success({ processed: materialsWithoutEmbedding.length, remaining: Number(count) });
        } catch (e) {
            console.error('generateMissingEmbeddings error:', e);
            return error('Сбой процесса');
        }
    }
}
