import { z } from 'zod';

export const materialSchema = z.object({
    code: z.string().min(1, 'Код обязателен'),
    name: z.string().min(1, 'Наименование обязательно'),
    unit: z.string().optional().nullable(),
    price: z.number().optional().nullable(),
    vendor: z.string().optional().nullable(),
    weight: z.string().optional().nullable(),
    categoryLv1: z.string().optional().nullable(),
    categoryLv2: z.string().optional().nullable(),
    categoryLv3: z.string().optional().nullable(),
    categoryLv4: z.string().optional().nullable(),
    productUrl: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    status: z.enum(['active', 'draft', 'archived', 'deleted']).default('active'),
});

export const workSchema = z.object({
    code: z.string().optional().nullable(),
    sortOrder: z.number().optional(),
    name: z.string().min(1, 'Наименование обязательно'),
    unit: z.string().optional().nullable(),
    price: z.number().optional().nullable(),
    shortDescription: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    phase: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    subcategory: z.string().optional().nullable(),
    status: z.enum(['active', 'draft', 'archived', 'deleted']).default('active'),
});

export const batchMaterialSchema = z.array(materialSchema);
export const batchWorkSchema = z.array(workSchema);
