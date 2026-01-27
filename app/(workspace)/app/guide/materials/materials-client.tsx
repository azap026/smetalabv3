'use client';

import * as React from 'react';
import { useRef, useTransition, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Download, Trash2, Loader2, Plus } from 'lucide-react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { exportMaterials, deleteAllMaterials, createMaterial, searchMaterials } from '@/app/actions/materials';
import * as xlsx from 'xlsx';
import { useToast } from "@/components/ui/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import { MaterialRow } from '@/types/material-row';

interface MaterialsClientProps {
    initialData: MaterialRow[];
}

export function MaterialsClient({ initialData }: MaterialsClientProps) {
    const { toast } = useToast();
    const [isExporting, startExportTransition] = useTransition();
    const [isImporting, startImportTransition] = useTransition();
    const [isDeletingAll, startDeleteAllTransition] = useTransition();
    const [isAiSearching, startAiSearchTransition] = useTransition();
    const [mounted, setMounted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [data, setData] = useState<MaterialRow[]>(initialData);

    useEffect(() => {
        setData(initialData);
    }, [initialData]);

    const handleExport = () => {
        startExportTransition(async () => {
            const result = await exportMaterials();
            if (result.success && result.data) {
                const worksheet = xlsx.utils.json_to_sheet(result.data);
                const workbook = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(workbook, worksheet, 'Materials');
                xlsx.writeFile(workbook, 'materials_export.xlsx');
                toast({ title: "Экспорт успешен" });
            } else {
                toast({ variant: "destructive", title: "Ошибка экспорта" });
            }
        });
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            console.log(`Sending file: ${file.name}, size: ${file.size} bytes`);

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
                } catch (error: unknown) {
                    console.error('Upload error:', error);
                    const errorMessage = error instanceof Error ? error.message : "Не удалось отправить файл на сервер.";
                    toast({
                        variant: "destructive",
                        title: "Ошибка",
                        description: errorMessage
                    });
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
            } else {
                toast({ variant: "destructive", title: "Ошибка" });
            }
        });
    };

    const [isInserting, startInsertTransition] = useTransition();

    const onInsertRequest = (afterId?: string) => {
        if (data.some(r => r.isPlaceholder)) return;

        const placeholder: MaterialRow = {
            id: 'placeholder-' + Date.now(),
            tenantId: initialData[0]?.tenantId || null,
            code: '',
            name: '',
            unit: '',
            price: 0,
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            shortDescription: null,
            description: null,
            category: data.length > 0 ? data[data.length - 1].category : '',
            subcategory: data.length > 0 ? data[data.length - 1].subcategory : '',
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
                category: row.category,
                subcategory: row.subcategory,
                vendor: row.vendor,
                weight: row.weight,
                categoryLv1: row.categoryLv1,
                categoryLv2: row.categoryLv2,
                categoryLv3: row.categoryLv3,
                categoryLv4: row.categoryLv4,
                productUrl: row.productUrl,
                imageUrl: row.imageUrl,
                status: 'active'
            });

            if (result.success) {
                toast({ title: "Материал добавлен" });
            } else {
                toast({ variant: "destructive", title: "Ошибка", description: result.message });
            }
        });
    };

    const handleAiSearch = async (query: string) => {
        if (!query || query.length < 2) {
            setData(initialData);
            return;
        }

        startAiSearchTransition(async () => {
            const result = await searchMaterials(query);
            if (result.success && result.data) {
                setData(result.data as MaterialRow[]);
            } else {
                toast({ variant: "destructive", title: "Ошибка поиска", description: result.message });
            }
        });
    };

    return (
        <div className="space-y-6">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv, .xlsx, .xls" />
            <Breadcrumb className="px-1 md:px-0">
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink href="/app">Главная</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbLink>Справочники</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Материалы</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1 md:px-0">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Материалы</h2>
                    <p className="text-sm text-muted-foreground md:text-base">База строительных материалов</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {mounted && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" className="flex-1 md:flex-none h-9 text-xs md:text-sm" onClick={handleImportClick} disabled={isImporting}>
                                        {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                        Импорт
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Загрузить данные</p></TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" className="flex-1 md:flex-none h-9 text-xs md:text-sm" onClick={handleExport} disabled={isExporting}>
                                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                        Экспорт
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Выгрузить данные</p></TooltipContent>
                            </Tooltip>

                            <AlertDialog>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" className="flex-1 md:flex-none h-9 text-xs md:text-sm" disabled={isDeletingAll || initialData.length === 0}>
                                                {isDeletingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                                Удалить всё
                                            </Button>
                                        </AlertDialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Удалить все материалы</p></TooltipContent>
                                </Tooltip>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                        <AlertDialogDescription>Все материалы будут удалены.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground">Удалить всё</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </TooltipProvider>
                    )}
                    <Button className="flex-1 md:flex-none h-9 text-xs md:text-sm" onClick={() => onInsertRequest()}>
                        <Plus className="mr-2 h-4 w-4" /> Добавить
                    </Button>
                </div>
            </div>

            <div className="relative">
                {(isImporting || isInserting) && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-lg">
                        <div className="flex flex-col items-center gap-3 p-6 bg-card border shadow-xl rounded-xl">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-sm font-semibold">{isInserting ? "Сохранение..." : "Импорт..."}</p>
                        </div>
                    </div>
                )}
                <DataTable
                    columns={columns}
                    data={data}
                    height="600px"
                    filterColumn="name"
                    filterPlaceholder="Поиск по наименованию..."
                    showAiSearch={true}
                    onAiSearch={handleAiSearch}
                    isSearching={isAiSearching}
                    meta={{
                        onInsertRequest,
                        onCancelInsert,
                        onSaveInsert,
                        updatePlaceholderRow
                    }}
                />
            </div>
        </div>
    );
}
