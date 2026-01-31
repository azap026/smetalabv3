'use server';

import { WorksService } from '@/lib/services/works.service';
import { safeAction } from '@/lib/actions/safe-action';

export const fetchMoreWorks = safeAction(async ({ team }, { query, lastSortOrder }: { query?: string, lastSortOrder?: number } = {}) => {
    return await WorksService.getMany(team.id, undefined, query, lastSortOrder);
});
