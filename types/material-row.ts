import { Material } from '@/lib/db/schema';

export type MaterialRow = Omit<Material, 'embedding'> & {
    embedding?: number[] | null;
    isPlaceholder?: boolean;
    similarity?: number;
};
