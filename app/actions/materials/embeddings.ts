'use server';

import { MaterialsService } from '@/lib/services/materials.service';
import { safeAction } from '@/lib/actions/safe-action';

export const generateMissingEmbeddings = safeAction(async ({ team }) => {
    return await MaterialsService.generateMissingEmbeddings(team.id);
});
