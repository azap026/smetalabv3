'use server';

import { revalidatePath } from 'next/cache';
import { WorksService } from '@/lib/services/works.service';
import { safeAction } from '@/lib/actions/safe-action';

export const reorderWorks = safeAction(async ({ team }) => {
    const result = await WorksService.reorder(team.id);
    if (result.success) {
        revalidatePath('/app/guide/works');
    }
    return result;
});

export const getUniqueUnits = safeAction(async ({ team }) => {
    return await WorksService.getUniqueUnits(team.id);
});


