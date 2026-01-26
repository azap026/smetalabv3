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
import { columns, Material } from "./columns";

const materials: Material[] = [
    { id: 1, code: 'М-001', name: 'Бетон М300 B22.5', unit: 'м3', price: 4500 },
    { id: 2, code: 'М-002', name: 'Арматура A500C 12мм', unit: 'т', price: 65000 },
    { id: 3, code: 'М-003', name: 'Кирпич полнотелый М150', unit: 'шт', price: 18 },
    { id: 4, code: 'М-004', name: 'Газобетонный блок 600х300х200', unit: 'м3', price: 5800 },
    { id: 5, code: 'М-005', name: 'Штукатурка гипсовая Knauf MP-75', unit: 'меш', price: 450 },
    { id: 6, code: 'М-006', name: 'Клей для плитки Ceresit CM-11', unit: 'меш', price: 650 },
    { id: 7, code: 'М-007', name: 'Ламинат 33 класс 8мм', unit: 'м2', price: 850 },
    { id: 8, code: 'М-008', name: 'Кабель ВВГнг-LS 3х2.5', unit: 'мп', price: 85 },
    { id: 9, code: 'М-009', name: 'Труба металлопластиковая 16мм', unit: 'мп', price: 120 },
    { id: 10, code: 'М-010', name: 'Гипсокартон Knauf 9.5мм', unit: 'лист', price: 380 },
    { id: 11, code: 'М-011', name: 'Профиль CD-60 3м', unit: 'шт', price: 210 },
    { id: 12, code: 'М-012', name: 'Саморезы по металлу 25мм', unit: 'уп', price: 350 },
];

export default function MaterialsPage() {
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
                        <BreadcrumbPage>Материалы</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1 md:px-0">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Материалы</h2>
                    <p className="text-sm text-muted-foreground md:text-base">
                        База строительных материалов
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

            <DataTable columns={columns} data={materials} height="530px" filterColumn="name" filterPlaceholder="Поиск по наименованию..." />
        </div>
    );
}

