import { Work } from '@/lib/db/schema';

export type WorkRow = Omit<Work, 'embedding'> & {
    embedding?: number[] | null;
    isPlaceholder?: boolean;
    similarity?: number;
};
