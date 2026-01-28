'use server';

import { MaterialsService } from '@/lib/services/materials.service';
import { safeAction } from '@/lib/actions/safe-action';

export const searchMaterials = safeAction(async ({ team }, query: string) => {
    return await MaterialsService.search(team.id, query);
});
