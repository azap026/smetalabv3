"use client"

import * as React from "react"
import { ColumnDef, Table } from "@tanstack/react-table"
import { Pencil, Settings, Trash, Loader2, Plus, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import { deleteWork, updateWork } from "@/app/actions/works"
import { useToast } from "@/components/ui/use-toast"
import { WorkRow } from "@/types/work-row"
import { UnitSelect } from "@/components/unit-select"
import { TableMeta } from "@/components/ui/data-table"

const RowActions = ({ row, table }: { row: { original: WorkRow }, table: Table<WorkRow> }) => {
    const { toast } = useToast()
    const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
    const [isEditOpen, setIsEditOpen] = React.useState(false)
    const [isDeleting, startDeleteTransition] = React.useTransition()
    const [isUpdating, startUpdateTransition] = React.useTransition()

    const meta = table.options.meta as TableMeta<WorkRow>

    if (row.original.isPlaceholder) {
        return (
            <div className="flex gap-1 justify-end pr-2">
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50 shadow-sm border border-transparent hover:border-green-100"
                    onClick={(e) => {
                        e.stopPropagation();
                        meta.onSaveInsert?.(row.original.id);
                    }}
                >
                    <Check className="h-3 w-3" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive hover:bg-destructive/5"
                    onClick={(e) => {
                        e.stopPropagation();
                        meta.onCancelInsert?.();
                    }}
                >
                    <X className="h-3 w-3" />
                </Button>
            </div>
        )
    }

    const [formData, setFormData] = React.useState({
        code: row.original.code || "",
        name: row.original.name || "",
        price: row.original.price?.toString() || "",
        unit: row.original.unit || "",
        phase: row.original.phase || "",
        category: row.original.category || "",
        subcategory: row.original.subcategory || "",
    })

    const handleDelete = () => {
        startDeleteTransition(async () => {
            const result = await deleteWork(row.original.id)
            if (result.success) {
                toast({
                    title: "Запись удалена",
                    description: result.message,
                })
                setIsDeleteOpen(false)
            } else {
                toast({
                    variant: "destructive",
                    title: "Ошибка",
                    description: result.message,
                })
            }
        })
    }

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault()
        startUpdateTransition(async () => {
            const result = await updateWork(row.original.id, {
                ...formData,
                price: formData.price ? Number(formData.price) : undefined
            })
            if (result.success) {
                toast({
                    title: "Запись обновлена",
                    description: result.message,
                })
                setIsEditOpen(false)
            } else {
                toast({
                    variant: "destructive",
                    title: "Ошибка",
                    description: result.message,
                })
            }
        })
    }

    return (
        <TooltipProvider>
            <div className="flex items-center justify-end md:pr-4 gap-0 md:gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-100 md:opacity-50 md:hover:opacity-100 transition-opacity text-primary"
                            onClick={() => meta?.onInsertRequest?.(row.original.id)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Вставить строку ниже</p>
                    </TooltipContent>
                </Tooltip>

                <DropdownMenu modal={false}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-100 md:opacity-70 md:group-hover:opacity-100 transition-opacity"
                                    disabled={isDeleting || isUpdating}
                                >
                                    {isDeleting || isUpdating ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Settings className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">Настройки</span>
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Управление записью</p>
                        </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                            className="cursor-pointer"
                            onSelect={(e) => {
                                e.preventDefault();
                                setIsEditOpen(true);
                            }}
                        >
                            <Pencil className="mr-2 h-4 w-4" />
                            Изменить
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive cursor-pointer"
                            onSelect={(e) => {
                                e.preventDefault();
                                setIsDeleteOpen(true);
                            }}
                        >
                            <Trash className="mr-2 h-4 w-4" />
                            Удалить
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Изменить работу</DialogTitle>
                            <DialogDescription>
                                Внесите изменения в данные работы. Нажмите сохранить, когда закончите.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdate} className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="code" className="text-right">Код</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    className="col-span-3 h-8 text-sm"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Название</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="col-span-3 h-8 text-sm"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="unit" className="text-right">Ед. изм.</Label>
                                <div className="col-span-3">
                                    <UnitSelect
                                        value={formData.unit || ""}
                                        onChange={(val) => setFormData({ ...formData, unit: val })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="price" className="text-right">Цена</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="col-span-3 h-8 text-sm"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="phase" className="text-right">Этап</Label>
                                <Input
                                    id="phase"
                                    value={formData.phase}
                                    onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                                    className="col-span-3 h-8 text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="category" className="text-right">Раздел</Label>
                                <Input
                                    id="category"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="col-span-3 h-8 text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="subcategory" className="text-right">Подраздел</Label>
                                <Input
                                    id="subcategory"
                                    value={formData.subcategory}
                                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                                    className="col-span-3 h-8 text-sm"
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isUpdating} className="h-9 px-8">
                                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Сохранить
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Это действие нельзя будет отменить. Запись "{row.original.name}" будет удалена из базы данных.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault()
                                    handleDelete()
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Удаление..." : "Удалить"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </TooltipProvider>
    )
}

export const columns: ColumnDef<WorkRow>[] = [
    {
        accessorKey: "code",
        header: "Код",
        size: 100,
        cell: ({ row, table }) => {
            const isPlaceholder = row.original.isPlaceholder;
            const meta = table.options.meta as TableMeta<WorkRow>

            return (
                <div className="relative group/cell flex items-center h-full min-h-[40px]">
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
                    <div className="font-medium text-xs md:text-sm">
                        {isPlaceholder ? "..." : row.getValue("code")}
                    </div>
                </div>
            )
        },
        sortingFn: (rowA, rowB, columnId) => {
            const a = String(rowA.getValue(columnId)).split('.').map(Number);
            const b = String(rowB.getValue(columnId)).split('.').map(Number);
            for (let i = 0; i < Math.max(a.length, b.length); i++) {
                if ((a[i] || 0) < (b[i] || 0)) return -1;
                if ((a[i] || 0) > (b[i] || 0)) return 1;
            }
            return 0;
        },
    },
    {
        accessorKey: "name",
        header: "Наименование",
        size: 500,
        cell: ({ row, table }) => {
            const isPlaceholder = row.original.isPlaceholder;
            const meta = table.options.meta as TableMeta<WorkRow>

            if (isPlaceholder) {
                return (
                    <Input
                        placeholder="Наименование работы..."
                        className="h-8 text-xs md:text-sm bg-transparent border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                        autoFocus
                        value={row.original.name}
                        onChange={(e) => meta.updatePlaceholderRow?.(row.original.id, { name: e.target.value })}
                    />
                )
            }

            const phase = row.original.phase;
            const category = row.original.category;
            const subcategory = row.original.subcategory;
            const path = [phase, category, subcategory].filter(Boolean).join(" / ");

            return (
                <div className="flex flex-col gap-1 py-1">
                    <div className="text-xs md:text-sm font-medium leading-none">
                        {row.getValue("name")}
                    </div>
                    {path && (
                        <div className="text-[10px] md:text-xs text-muted-foreground font-normal">
                            {path}
                        </div>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: "unit",
        header: () => <div className="text-center">Ед. изм.</div>,
        size: 100,
        cell: ({ row, table }) => {
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
        },
    },
    {
        accessorKey: "price",
        header: () => <div className="text-center">Цена</div>,
        size: 140,
        cell: ({ row, table }) => {
            const isPlaceholder = row.original.isPlaceholder;
            const meta = table.options.meta as TableMeta<WorkRow>

            if (isPlaceholder) {
                return (
                    <Input
                        type="number"
                        placeholder="Цена"
                        className="h-8 text-xs text-center bg-transparent border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                        value={row.original.price || ""}
                        onChange={(e) => meta.updatePlaceholderRow?.(row.original.id, { price: Number(e.target.value) })}
                    />
                )
            }
            const priceValue = row.getValue("price");
            const price = typeof priceValue === 'number' ? priceValue : parseFloat(String(priceValue));
            const formatted = new Intl.NumberFormat("ru-RU", {
                style: "currency",
                currency: "RUB",
                minimumFractionDigits: 0,
            }).format(isNaN(price) ? 0 : price)

            return <div className="text-center font-bold text-xs md:text-sm">{formatted}</div>
        },
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
                    <Settings className="h-4 w-4 opacity-50" />
                </div>
            )
        },
        size: 90,
        cell: ({ row, table }) => <RowActions row={row} table={table} />,
    },
]
