'use client';

import { useRef, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download, Trash2, Loader2 } from 'lucide-react';
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
import { Work } from "@/lib/db/schema";
import { importWorks, exportWorks } from './actions';
import * as xlsx from 'xlsx';
import { useToast } from "@/components/ui/use-toast";

interface WorksClientProps {
    initialData: Work[];
}

export function WorksClient({ initialData }: WorksClientProps) {
    const { toast } = useToast();
    const [isExporting, startExportTransition] = useTransition();
    const [isImporting, startImportTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        startExportTransition(async () => {
            const result = await exportWorks();
            if (result.success && result.data) {
                const worksheet = xlsx.utils.json_to_sheet(result.data);
                const workbook = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(workbook, worksheet, 'Works');
                xlsx.writeFile(workbook, 'works_export.xlsx');
                toast({
                    title: "Экспорт успешен",
                    description: "Данные работ были успешно экспортированы.",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Ошибка экспорта",
                    description: result.message || "Не удалось экспортировать данные.",
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
                        title: "Импорт успешен",
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
        }
        // Reset file input to allow re-uploading the same file
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
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
                    <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Работы</h2>
                    <p className="text-sm text-muted-foreground md:text-base">
                        Базовая стоимость и состав работ
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <Button variant="outline" className="flex-1 md:flex-none h-9 text-xs md:text-sm" onClick={handleImportClick} disabled={isImporting}>
                        {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Импорт
                    </Button>
                    <Button variant="outline" className="flex-1 md:flex-none h-9 text-xs md:text-sm" onClick={handleExport} disabled={isExporting}>
                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Экспорт
                    </Button>
                    <Button variant="destructive" className="flex-1 md:flex-none h-9 text-xs md:text-sm" disabled>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Удалить
                    </Button>
                    <Button className="flex-1 md:flex-none h-9 text-xs md:text-sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Добавить
                    </Button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={initialData}
                height="530px"
                filterColumn="name"
                filterPlaceholder="Поиск по наименованию..."
            />
        </div>
    );
}
