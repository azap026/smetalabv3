'use server';

import { revalidatePath } from 'next/cache';
import { NewWork } from '@/lib/db/schema';
import { WorksService } from '@/lib/services/works.service';
import { safeAction } from '@/lib/actions/safe-action';

export const deleteWork = safeAction(async ({ team }, id: string) => {
    const result = await WorksService.delete(team.id, id);
    if (result.success) {
        revalidatePath('/app/guide/works');
    }
    return result;
});

export const deleteAllWorks = safeAction(async ({ team }) => {
    const result = await WorksService.deleteAll(team.id);
    if (result.success) {
        revalidatePath('/app/guide/works');
    }
    return result;
});

export const updateWork = safeAction(async ({ team }, id: string, data: Partial<NewWork>) => {
    const result = await WorksService.update(team.id, id, data);
    if (result.success) {
        revalidatePath('/app/guide/works');
    }
    return result;
});

export const createWork = safeAction(async ({ team }, data: NewWork) => {
    const result = await WorksService.create(team.id, data);
    if (result.success) {
        revalidatePath('/app/guide/works');
    }
    return result;
});

export const insertWorkAfter = safeAction(async ({ team }, afterId: string | null, data: NewWork) => {
    const result = await WorksService.insertAfter(team.id, afterId, data);
    if (result.success) {
        revalidatePath('/app/guide/works');
    }
    return result;
});
