'use client';

import { Button } from '@/components/ui/button';
import { Plus, Upload, Download, Trash2 } from 'lucide-react';
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

interface WorksClientProps {
    initialData: Work[];
}

export function WorksClient({ initialData }: WorksClientProps) {
    return (
        <div className="space-y-6">
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
                    <Button variant="outline" className="flex-1 md:flex-none h-9 text-xs md:text-sm">
                        <Upload className="mr-2 h-4 w-4" />
                        Импорт
                    </Button>
                    <Button variant="outline" className="flex-1 md:flex-none h-9 text-xs md:text-sm">
                        <Download className="mr-2 h-4 w-4" />
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
