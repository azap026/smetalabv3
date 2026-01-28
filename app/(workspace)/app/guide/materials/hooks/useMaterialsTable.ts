import { MaterialRow } from '@/types/material-row';

export function useMaterialsTable(data: MaterialRow[], setData: React.Dispatch<React.SetStateAction<MaterialRow[]>>) {
    const onInsertRequest = (afterId?: string) => {
        if (data.some(r => r.isPlaceholder)) return;

        const placeholder: MaterialRow = {
            id: 'placeholder-' + Date.now(),
            tenantId: data[0]?.tenantId || null,
            code: '',
            name: '',
            unit: '',
            price: 0,
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            description: null,
            vendor: '',
            weight: '',
            categoryLv1: '',
            categoryLv2: '',
            categoryLv3: '',
            categoryLv4: '',
            productUrl: '',
            imageUrl: '',
            tags: null,
            metadata: {},
            isPlaceholder: true
        };

        if (!afterId) {
            setData([...data, placeholder]);
        } else {
            const index = data.findIndex(r => r.id === afterId);
            const newData = [...data];
            newData.splice(index + 1, 0, placeholder);
            setData(newData);
        }
    };

    const onCancelInsert = () => setData(data.filter(r => !r.isPlaceholder));

    const updatePlaceholderRow = (id: string, partial: Partial<MaterialRow>) => {
        setData(prev => prev.map(r => r.id === id ? { ...r, ...partial } : r));
    };

    return {
        onInsertRequest,
        onCancelInsert,
        updatePlaceholderRow
    };
}
