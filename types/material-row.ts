import { Material } from '@/lib/db/schema';

export type MaterialRow = Omit<Material, 'embedding' | 'searchVector'> & {
    embedding?: number[] | null;
    isPlaceholder?: boolean;
    similarity?: number;
    boostedScore?: number;
};
