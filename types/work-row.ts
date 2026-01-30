import { Material, Work } from '@/lib/db/schema';

export type WorkRow = Omit<Work, 'embedding' | 'searchVector'> & {
    embedding?: number[] | null;
    isPlaceholder?: boolean;
    similarity?: number;
};
