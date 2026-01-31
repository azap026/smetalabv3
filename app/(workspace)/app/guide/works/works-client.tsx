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
import { importWorks, exportWorks, deleteAllWorks, reorderWorks } from '@/app/actions/works';
import * as XLSX from 'xlsx';
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

import { WorkRow } from '@/types/work-row';
import { useWorksTable } from './hooks/useWorksTable';

interface WorksClientProps {
    initialData: WorkRow[];
    totalCount: number;
}

import { useWorksSearch } from './hooks/useWorksSearch';

export function WorksClient({ initialData, totalCount }: WorksClientProps) {
    const { toast } = useToast();
    const [isExporting, startExportTransition] = useTransition();
    const [isImporting, startImportTransition] = useTransition();
    const [isDeletingAll, startDeleteAllTransition] = useTransition();
    const [mounted, setMounted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);


    const handleExport = () => {
        startExportTransition(async () => {
            const result = await exportWorks();
            if (result.success) {
                const worksheet = XLSX.utils.json_to_sheet(result.data);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Works');
                XLSX.writeFile(workbook, 'works_export.xlsx');
                toast({
                    title: "Экспорт успешен",
                    description: "Данные работ были успешно экспортированы.",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Ошибка экспорта",
                    description: result.message,
                });
            }
        });
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file);

            startImportTransition(async () => {
                const result = await importWorks(formData);
                if (result.success) {
                    toast({
                        title: "Импорт завершен",
                        description: result.message,
                    });
                } else {
                    toast({
                        variant: "destructive",
                        title: "Ошибка импорта",
                        description: result.message,
                    });
                }
            });
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteAll = () => {
        startDeleteAllTransition(async () => {
            const result = await deleteAllWorks();
            if (result.success) {
                toast({
                    title: "Справочник очищен",
                    description: result.message,
                });
                setData([]);
            } else {
                toast({
                    variant: "destructive",
                    title: "Ошибка при очистке",
                    description: result.message,
                });
            }
        });
    };



    const {
        data,
        setData,
        isInserting,
        onInsertRequest,
        onCancelInsert,
        updatePlaceholderRow,
        onSaveInsert
    } = useWorksTable(initialData);

    const search = useWorksSearch(initialData, data, setData);

    useEffect(() => {
        setData(initialData);
    }, [initialData, setData]);


    // Sorting reset
    const [, startReorderTransition] = useTransition();

    const handleReorder = () => {
        startReorderTransition(async () => {
            const result = await reorderWorks();
            if (result.success) {
                toast({ title: "Сортировка сброшена", description: "Порядок записей успешно обновлен." });
            } else {
                toast({ variant: "destructive", title: "Ошибка", description: result.message });
            }
        });
    };


    return (
        <div className="space-y-6">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            />
            <Breadcrumb className="px-1 md:px-0">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/app">Главная</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Справочники</BreadcrumbPage>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Работы</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1 md:px-0">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
                        Работы
                        <span className="text-muted-foreground font-normal text-xl md:text-2xl">({totalCount.toLocaleString('ru-RU')})</span>
                        {search.isAiSearching && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                    </h2>
                    <p className="text-sm text-muted-foreground md:text-base">
                        Базовая стоимость и состав работ
                    </p>
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
                                <TooltipContent>
                                    <p>Загрузить данные из файла</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" className="flex-1 md:flex-none h-9 text-xs md:text-sm" onClick={handleExport} disabled={isExporting}>
                                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                        Экспорт
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Выгрузить данные в файл</p>
                                </TooltipContent>
                            </Tooltip>

                            <AlertDialog>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="destructive"
                                                className="flex-1 md:flex-none h-9 text-xs md:text-sm"
                                                disabled={isDeletingAll || initialData.length === 0}
                                            >
                                                {isDeletingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                                Удалить всё
                                            </Button>
                                        </AlertDialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Удалить все записи</p>
                                    </TooltipContent>
                                </Tooltip>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Это действие необратимо. Весь справочник работ для вашей команды будет полностью удален.
                                        </AlertDialogDescription>
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
                        <div className="flex flex-col items-center gap-3 p-6 bg-card border shadow-xl rounded-xl animate-in fade-in zoom-in duration-200">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-sm font-semibold">
                                    {isInserting ? "Сохранение записи..." : "Идет импорт данных..."}
                                </p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Пожалуйста, подождите</p>
                            </div>
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
                    onAiSearch={search.handleAiSearch}
                    isSearching={search.isAiSearching}
                    externalSearchValue={search.searchTerm}
                    onSearchValueChange={search.setSearchTerm}
                    onEndReached={search.loadMore}
                    meta={{
                        onInsertRequest,
                        onCancelInsert,
                        onSaveInsert,
                        updatePlaceholderRow,
                        onReorder: handleReorder
                    }}
                />
            </div>
        </div>
    );
}
