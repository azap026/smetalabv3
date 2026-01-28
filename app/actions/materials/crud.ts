'use server';

import { revalidatePath } from 'next/cache';
import { NewMaterial } from '@/lib/db/schema';
import { MaterialsService } from '@/lib/services/materials.service';
import { safeAction } from '@/lib/actions/safe-action';

export const deleteMaterial = safeAction(async ({ team }, id: string) => {
    const result = await MaterialsService.delete(team.id, id);
    if (result.success) {
        revalidatePath('/app/guide/materials');
    }
    return result;
});

export const deleteAllMaterials = safeAction(async ({ team }) => {
    const result = await MaterialsService.deleteAll(team.id);
    if (result.success) {
        revalidatePath('/app/guide/materials');
    }
    return result;
});

export const updateMaterial = safeAction(async ({ team }, id: string, data: Partial<NewMaterial>) => {
    const result = await MaterialsService.update(team.id, id, data);
    if (result.success) {
        revalidatePath('/app/guide/materials');
    }
    return result;
});

export const createMaterial = safeAction(async ({ team }, data: NewMaterial) => {
    const result = await MaterialsService.create(team.id, data);
    if (result.success) {
        revalidatePath('/app/guide/materials');
    }
    return result;
});
