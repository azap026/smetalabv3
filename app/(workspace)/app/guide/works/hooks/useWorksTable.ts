'use client';

import { useState, useTransition } from 'react';
import { WorkRow } from '@/types/work-row';
import { insertWorkAfter } from '@/app/actions/works';
import { useToast } from '@/components/ui/use-toast';

export function useWorksTable(initialData: WorkRow[]) {
    const { toast } = useToast();
    const [data, setData] = useState<WorkRow[]>(initialData);
    const [isInserting, startInsertTransition] = useTransition();

    const onInsertRequest = (afterId?: string) => {
        if (data.some(r => r.isPlaceholder)) return;

        const placeholder: WorkRow = {
            id: 'placeholder-' + Date.now(),
            tenantId: data[0]?.tenantId || null,
            code: '',
            name: '',
            unit: '',
            price: 0,
            phase: 'Этап 1',
            category: '',
            subcategory: '',
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            shortDescription: null,
            description: null,
            tags: null,
            metadata: {},
            sortOrder: 0,
            isPlaceholder: true
        };

        if (!afterId || data.length === 0) {
            setData([...data, { ...placeholder, code: data.length > 0 ? `${data.length + 1}` : '1.1' }]);
            return;
        }

        const index = data.findIndex(r => r.id === afterId);
        if (index === -1) return;

        const newData = [...data];
        newData.splice(index + 1, 0, {
            ...placeholder,
            tenantId: data[index].tenantId,
            phase: data[index].phase,
            category: data[index].category,
            subcategory: data[index].subcategory,
        });
        setData(newData);
    };

    const onCancelInsert = () => {
        setData(data.filter(r => !r.isPlaceholder));
    };

    const updatePlaceholderRow = (placeholderId: string, partial: Partial<WorkRow>) => {
        setData(prev => prev.map(row =>
            row.id === placeholderId ? { ...row, ...partial } : row
        ));
    };

    const onSaveInsert = (placeholderId: string) => {
        const row = data.find(r => r.id === placeholderId);
        if (!row) return;

        if (!row.name) {
            toast({ variant: "destructive", title: "Ошибка", description: "Введите название работы." });
            return;
        }
        if (!row.unit) {
            toast({ variant: "destructive", title: "Ошибка", description: "Выберите единицу измерения." });
            return;
        }

        startInsertTransition(async () => {
            const placeholderIndex = data.findIndex(r => r.id === placeholderId);
            const anchorWork = placeholderIndex > 0 ? data[placeholderIndex - 1] : null;

            const result = await insertWorkAfter(anchorWork ? anchorWork.id : null, {
                code: row.code || '',
                name: row.name,
                unit: row.unit || '',
                price: Number(row.price),
                phase: row.phase || '',
                category: row.category || '',
                subcategory: row.subcategory || '',
                status: 'active',
                shortDescription: row.shortDescription,
                description: row.description,
            });

            if (result.success) {
                toast({ title: "Запись вставлена", description: result.message });
            } else {
                toast({ variant: "destructive", title: "Ошибка", description: result.message });
            }
        });
    };

    return {
        data,
        setData,
        isInserting,
        onInsertRequest,
        onCancelInsert,
        updatePlaceholderRow,
        onSaveInsert
    };
}
