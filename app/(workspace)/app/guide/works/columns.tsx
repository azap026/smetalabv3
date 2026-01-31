"use client"

import * as React from "react"
import { ColumnDef, Table, Row } from "@tanstack/react-table"
import { Pencil, Settings, Trash, Plus, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import { WorkRow } from "@/types/work-row"
import { UnitSelect } from "@/components/unit-select"
import { TableMeta } from "@/components/ui/data-table"

interface RowActionsProps {
    row: { original: WorkRow };
    table: Table<WorkRow>;
}

const RowActions = React.memo(({ row, table }: RowActionsProps) => {
    const meta = table.options.meta as TableMeta<WorkRow> & {
        setEditingRow?: (row: WorkRow | null) => void;
        setDeletingRow?: (row: WorkRow | null) => void;
    };

    if (row.original.isPlaceholder) {
        return (
            <div className="flex gap-1 justify-end pr-2">
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-green-600 hover:text-green-700"
                    onClick={() => meta.onSaveInsert?.(row.original.id)}
                >
                    <Check className="h-3 w-3" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive"
                    onClick={() => meta.onCancelInsert?.()}
                >
                    <X className="h-3 w-3" />
                </Button>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-end md:pr-4 gap-1">
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary"
                onClick={() => meta?.onInsertRequest?.(row.original.id)}
            >
                <Plus className="h-4 w-4" />
            </Button>

            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Settings className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => meta.setEditingRow?.(row.original)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Изменить
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => meta.setDeletingRow?.(row.original)}
                    >
                        <Trash className="mr-2 h-4 w-4" />
                        Удалить
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
})
RowActions.displayName = "RowActions"

const IndexCell = React.memo(({ row, table }: { row: Row<WorkRow>; table: Table<WorkRow> }) => {
    const isPlaceholder = row.original.isPlaceholder;
    const meta = table.options.meta as TableMeta<WorkRow>
    const index = row.index + 1;

    return (
        <div className="relative group/cell flex items-center justify-center h-full min-h-[40px]">
            {!isPlaceholder && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="hidden md:flex absolute -left-10 h-7 w-7 rounded-full bg-lime-500 text-white opacity-0 group-hover/row:opacity-100 transition-opacity z-50 hover:bg-lime-600 shadow-md border-2 border-background"
                                onClick={() => meta.onInsertRequest?.(row.original.id)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            <p>Вставить строку ниже</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
            <div className="font-medium text-xs md:text-sm text-muted-foreground">
                {isPlaceholder ? "..." : index}
            </div>
        </div>
    );
});
IndexCell.displayName = "IndexCell";

const NameCell = React.memo(({ row, table }: { row: Row<WorkRow>; table: Table<WorkRow> }) => {
    const isPlaceholder = row.original.isPlaceholder;
    const meta = table.options.meta as TableMeta<WorkRow>

    if (isPlaceholder) {
        return (
            <Input
                placeholder="Наименование работы..."
                className="h-8 text-xs md:text-sm bg-transparent border-none shadow-none focus-visible:ring-0 px-0"
                autoFocus
                value={row.original.name || ""}
                onChange={(e) => meta.updatePlaceholderRow?.(row.original.id, { name: e.target.value })}
            />
        )
    }

    const { phase, category, subcategory, name } = row.original;
    const path = React.useMemo(() =>
        [phase, category, subcategory].filter(Boolean).join(" / "),
        [phase, category, subcategory]
    );

    return (
        <div className="flex flex-col gap-1 py-1">
            <div className="text-xs md:text-sm font-medium leading-none">{name}</div>
            {path && (
                <div className="text-[10px] md:text-xs text-muted-foreground font-normal">
                    {path}
                </div>
            )}
        </div>
    );
});
NameCell.displayName = "NameCell";

const UnitCell = React.memo(({ row, table }: { row: Row<WorkRow>; table: Table<WorkRow> }) => {
    const isPlaceholder = row.original.isPlaceholder;
    const meta = table.options.meta as TableMeta<WorkRow>

    if (isPlaceholder) {
        return (
            <UnitSelect
                value={row.original.unit || ""}
                onChange={(val: string) => meta.updatePlaceholderRow?.(row.original.id, { unit: val })}
            />
        )
    }
    return <div className="text-center text-xs md:text-sm">{row.getValue("unit")}</div>
});
UnitCell.displayName = "UnitCell";

const PriceCell = React.memo(({ row, table }: { row: Row<WorkRow>; table: Table<WorkRow> }) => {
    const isPlaceholder = row.original.isPlaceholder;
    const meta = table.options.meta as TableMeta<WorkRow>

    if (isPlaceholder) {
        return (
            <Input
                type="number"
                placeholder="Цена"
                className="h-8 text-xs text-center bg-transparent border-none shadow-none focus-visible:ring-0 px-0"
                value={row.original.price || ""}
                onChange={(e) => meta.updatePlaceholderRow?.(row.original.id, { price: Number(e.target.value) })}
            />
        )
    }

    const priceValue = row.getValue("price");
    const formatted = React.useMemo(() => {
        const price = typeof priceValue === 'number' ? priceValue : parseFloat(String(priceValue));
        return new Intl.NumberFormat("ru-RU", {
            style: "currency",
            currency: "RUB",
            minimumFractionDigits: 0,
        }).format(isNaN(price) ? 0 : price);
    }, [priceValue]);

    return <div className="text-center font-bold text-xs md:text-sm">{formatted}</div>
});
PriceCell.displayName = "PriceCell";

export const columns: ColumnDef<WorkRow>[] = [
    {
        accessorKey: "index",
        header: "№",
        size: 60,
        cell: (props) => <IndexCell {...props} />,
        enableSorting: false,
    },
    {
        accessorKey: "name",
        header: "Наименование",
        size: 500,
        cell: (props) => <NameCell {...props} />,
    },
    {
        accessorKey: "unit",
        header: () => <div className="text-center">Ед. изм.</div>,
        size: 100,
        cell: (props) => <UnitCell {...props} />,
    },
    {
        accessorKey: "price",
        header: () => <div className="text-center">Цена</div>,
        size: 140,
        cell: (props) => <PriceCell {...props} />,
    },
    {
        id: "actions",
        header: ({ table }) => {
            const meta = table.options.meta as TableMeta<WorkRow>
            return (
                <div className="flex justify-end pr-6 items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary opacity-50 hover:opacity-100"
                        onClick={() => meta.onInsertRequest?.()}
                        title="Добавить строку"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 hover:opacity-100">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => meta.onReorder?.()}>
                                Сбросить сортировку
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        },
        size: 90,
        cell: ({ row, table }) => <RowActions row={row} table={table} />,
    },
]
