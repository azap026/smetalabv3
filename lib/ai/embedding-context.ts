
export interface MaterialContextInput {
    name: string;
    code: string;
    description?: string | null;
    categoryLv1?: string | null;
    categoryLv2?: string | null;
    categoryLv3?: string | null;
    categoryLv4?: string | null;
    vendor?: string | null;
    unit?: string | null;
    weight?: string | null;
}

export interface WorkContextInput {
    name: string;
    code?: string | null;
    description?: string | null;
    shortDescription?: string | null;
    category?: string | null;
    subcategory?: string | null;
    phase?: string | null;
    unit?: string | null;
}

export function buildMaterialContext(data: MaterialContextInput): string {
    const categoryChain = [
        data.categoryLv1,
        data.categoryLv2,
        data.categoryLv3,
        data.categoryLv4
    ].filter(Boolean).join(' > ');

    const parts = [
        categoryChain ? `Категория: ${categoryChain}` : null,
        `Материал: ${data.name}`,
        data.code ? `Код: ${data.code}` : null,
        data.vendor ? `Поставщик: ${data.vendor}` : null,
        data.unit ? `Ед.изм: ${data.unit}` : null,
        data.weight ? `Вес: ${data.weight}` : null,
        data.description ? `Описание: ${data.description}` : null
    ];

    return parts.filter(Boolean).join(' | ');
}

export function buildWorkContext(data: WorkContextInput): string {
    const parts = [
        data.phase ? `Этап: ${data.phase}` : null,
        data.category ? `Раздел: ${data.category}` : null,
        data.subcategory ? `Подраздел: ${data.subcategory}` : null,
        `Работа: ${data.name}`,
        data.code ? `Код: ${data.code}` : null,
        data.unit ? `Ед.изм: ${data.unit}` : null,
        data.shortDescription ? `Краткое описание: ${data.shortDescription}` : null,
        data.description ? `Описание: ${data.description}` : null
    ];

    return parts.filter(Boolean).join(' | ');
}
