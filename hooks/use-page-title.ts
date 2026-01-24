'use client';

import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
    '/app': 'Главная',
    '/app/projects': 'Проекты',
    '/app/global-purchases': 'Закупки',
    '/app/patterns': 'Шаблоны',
    '/app/guide': 'Справочник',
    '/app/guide/works': 'Работы',
    '/app/guide/materials': 'Материалы',
    '/app/guide/counterparties': 'Контрагенты',
};

export function usePageTitle(): string {
    const pathname = usePathname();

    // Exact match
    if (pageTitles[pathname]) {
        return pageTitles[pathname];
    }

    // Dynamic routes
    if (pathname.startsWith('/app/projects/') && pathname.includes('/estimates/')) {
        if (pathname.endsWith('/parameters')) return 'Параметры сметы';
        if (pathname.endsWith('/accomplishment')) return 'Выполнение';
        if (pathname.endsWith('/purchases')) return 'Закупки сметы';
        if (pathname.endsWith('/docs')) return 'Документы';
        return 'Смета';
    }

    if (pathname.startsWith('/app/projects/')) {
        return 'Проект';
    }

    return 'Smetalab';
}
