import { useTransition, useRef } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { exportMaterials, deleteAllMaterials, createMaterial } from '@/app/actions/materials';
import * as XLSX from 'xlsx';
import { MaterialRow } from '@/types/material-row';

export function useMaterialsActions(data: MaterialRow[], setData: React.Dispatch<React.SetStateAction<MaterialRow[]>>) {
    const { toast } = useToast();
    const [isExporting, startExportTransition] = useTransition();
    const [isImporting, startImportTransition] = useTransition();
    const [isDeletingAll, startDeleteAllTransition] = useTransition();
    const [isInserting, startInsertTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        startExportTransition(async () => {
            const result = await exportMaterials();
            if (result.success) {
                const worksheet = XLSX.utils.json_to_sheet(result.data);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Materials');
                XLSX.writeFile(workbook, 'materials_export.xlsx');
                toast({ title: "Экспорт успешен" });
            } else {
                toast({ variant: "destructive", title: "Ошибка экспорта", description: result.message });
            }
        });
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file);

            startImportTransition(async () => {
                try {
                    const response = await fetch('/api/upload/materials', {
                        method: 'POST',
                        body: formData,
                    });
                    const result = await response.json();
                    if (response.ok && result.success) {
                        toast({ title: "Импорт завершен", description: result.message });
                    } else {
                        toast({ variant: "destructive", title: "Ошибка импорта", description: result.message || "Неизвестная ошибка" });
                    }
                } catch (_error) {
                    toast({ variant: "destructive", title: "Ошибка", description: "Не удалось отправить файл на сервер." });
                }
            });
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDeleteAll = () => {
        startDeleteAllTransition(async () => {
            const result = await deleteAllMaterials();
            if (result.success) {
                toast({ title: "Справочник очищен" });
                setData([]);
            } else {
                toast({ variant: "destructive", title: "Ошибка", description: result.message });
            }
        });
    };

    const onSaveInsert = (id: string) => {
        const row = data.find(r => r.id === id);
        if (!row || !row.name || !row.unit) {
            toast({ variant: "destructive", title: "Ошибка", description: "Заполните обязательные поля." });
            return;
        }

        startInsertTransition(async () => {
            const result = await createMaterial({
                code: row.code || `M-${Date.now()}`,
                name: row.name,
                unit: row.unit,
                price: Number(row.price),
                vendor: row.vendor || '',
                weight: row.weight || '',
                categoryLv1: row.categoryLv1 || '',
                categoryLv2: row.categoryLv2 || '',
                categoryLv3: row.categoryLv3 || '',
                categoryLv4: row.categoryLv4 || '',
                productUrl: row.productUrl || '',
                imageUrl: row.imageUrl || '',
                status: 'active'
            });

            if (result.success) {
                toast({ title: "Материал добавлен" });
            } else {
                toast({ variant: "destructive", title: "Ошибка", description: result.message });
            }
        });
    };

    return {
        isExporting,
        isImporting,
        isDeletingAll,
        isInserting,
        fileInputRef,
        handleExport,
        handleImportClick,
        handleFileChange,
        handleDeleteAll,
        onSaveInsert
    };
}
