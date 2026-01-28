'use server';

import { revalidatePath } from 'next/cache';
import { WorksService } from '@/lib/services/works.service';
import { safeAction } from '@/lib/actions/safe-action';

export const reorderWorks = safeAction(async function reorderWorksHandler({ team }) {
    const result = await WorksService.reorder(team.id);
    if (result.success) {
        revalidatePath('/app/guide/works');
    }
    return result;
}, { name: 'reorderWorks' });

export const getUniqueUnits = safeAction(async function getUniqueUnitsHandler({ team }) {
    return await WorksService.getUniqueUnits(team.id);
}, { name: 'getUniqueUnits' });


