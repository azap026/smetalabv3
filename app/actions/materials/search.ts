'use server';

import { MaterialsService } from '@/lib/services/materials.service';
import { safeAction } from '@/lib/actions/safe-action';

export const fetchMoreMaterials = safeAction(async ({ team }, query?: string) => {
    return await MaterialsService.getMany(team.id, undefined, query);
});
