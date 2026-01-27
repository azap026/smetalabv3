"use client"

import * as React from "react"
import { ColumnDef, Table } from "@tanstack/react-table"
import { Pencil, Settings, Trash, Check, X, Plus } from "lucide-react"
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

import { deleteMaterial, updateMaterial } from "@/app/actions/materials"
import { useToast } from "@/components/ui/use-toast"
import { MaterialRow } from "@/types/material-row"
import { TableMeta } from "@/components/ui/data-table"

const MaterialRowActions = ({ row, table }: { row: { original: MaterialRow }, table: Table<MaterialRow> }) => {
    const { toast } = useToast()
    const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
    const [isEditOpen, setIsEditOpen] = React.useState(false)
    const [isDeleting, startDeleteTransition] = React.useTransition()
    const [isUpdating, startUpdateTransition] = React.useTransition()

    const meta = table.options.meta as TableMeta<MaterialRow>

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
        category: row.original.category || "",
        subcategory: row.original.subcategory || "",
    })

    const handleDelete = () => {
        startDeleteTransition(async () => {
            const result = await deleteMaterial(row.original.id)
            if (result.success) {
                toast({ title: "Удалено", description: result.message })
                setIsDeleteOpen(false)
            } else {
                toast({ variant: "destructive", title: "Ошибка", description: result.message })
            }
        })
    }

    const handleUpdate = () => {
        startUpdateTransition(async () => {
            const result = await updateMaterial(row.original.id, {
                ...formData,
                price: formData.price ? Number(formData.price) : undefined
            })
            if (result.success) {
                toast({ title: "Обновлено", description: result.message })
                setIsEditOpen(false)
            } else {
                toast({ variant: "destructive", title: "Ошибка", description: result.message })
            }
        })
    }

    return (
        <div className="flex justify-end pr-2 items-center gap-1 group/actions">
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => meta.onInsertRequest?.(row.original.id)}
                title="Добавить строку ниже"
            >
                <Plus className="h-4 w-4" />
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-40 hover:opacity-100">
                        <Settings className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" /> Изменить
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setIsDeleteOpen(true)}>
                        <Trash className="mr-2 h-4 w-4" /> Удалить
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Запись будет безвозвратно удалена.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground" disabled={isDeleting}>
                            {isDeleting ? "Удаление..." : "Удалить"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Изменить материал</DialogTitle>
                        <DialogDescription>Отредактируйте данные материала.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">Название</Label>
                            <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-price" className="text-right">Цена</Label>
                            <Input id="edit-price" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-unit" className="text-right">Ед.изм.</Label>
                            <Input id="edit-unit" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isUpdating}>Отмена</Button>
                        <Button onClick={handleUpdate} disabled={isUpdating}>{isUpdating ? "Сохранение..." : "Сохранить"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export const columns: ColumnDef<MaterialRow>[] = [
    {
        accessorKey: "code",
        header: "Код",
        size: 100,
        cell: ({ row, table }) => {
            const isPlaceholder = row.original.isPlaceholder
            const meta = table.options.meta as TableMeta<MaterialRow>
            if (isPlaceholder) {
                return <Input className="h-8 text-xs font-medium border-primary/20 bg-primary/[0.02]" placeholder="Код..." value={row.original.code || ""} onChange={(e) => meta.updatePlaceholderRow?.(row.original.id, { code: e.target.value })} />
            }
            return <div className="font-medium text-xs md:text-sm px-2 text-muted-foreground">{row.getValue("code")}</div>
        }
    },
    {
        accessorKey: "name",
        header: "Наименование",
        size: 500,
        cell: ({ row, table }) => {
            const isPlaceholder = row.original.isPlaceholder
            const meta = table.options.meta as TableMeta<MaterialRow>
            if (isPlaceholder) {
                return <Input className="h-8 text-xs font-medium border-primary/20 bg-primary/[0.02]" placeholder="Название..." value={row.original.name || ""} onChange={(e) => meta.updatePlaceholderRow?.(row.original.id, { name: e.target.value })} />
            }
            return (
                <div className="flex flex-col gap-0.5 py-1">
                    <span className="text-xs md:text-sm font-semibold">{row.getValue("name")}</span>
                    {(row.original.category || row.original.subcategory) && (
                        <div className="flex gap-1 items-center text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                            {row.original.category} {row.original.subcategory && ` / ${row.original.subcategory}`}
                        </div>
                    )}
                </div>
            )
        }
    },
    {
        accessorKey: "unit",
        header: () => <div className="text-center">Ед.изм.</div>,
        size: 100,
        cell: ({ row, table }) => {
            const isPlaceholder = row.original.isPlaceholder
            const meta = table.options.meta as TableMeta<MaterialRow>
            if (isPlaceholder) {
                return <Input className="h-8 text-xs text-center border-primary/20 bg-primary/[0.02]" placeholder="ед..." value={row.original.unit || ""} onChange={(e) => meta.updatePlaceholderRow?.(row.original.id, { unit: e.target.value })} />
            }
            return <div className="text-center text-xs md:text-sm text-muted-foreground font-medium">{row.getValue("unit")}</div>
        }
    },
    {
        accessorKey: "price",
        header: () => <div className="text-center">Цена</div>,
        size: 130,
        cell: ({ row, table }) => {
            const isPlaceholder = row.original.isPlaceholder
            const meta = table.options.meta as TableMeta<MaterialRow>
            if (isPlaceholder) {
                return <Input className="h-8 text-xs text-center font-bold border-primary/20 bg-primary/[0.02]" type="number" placeholder="0" value={row.original.price || ""} onChange={(e) => meta.updatePlaceholderRow?.(row.original.id, { price: Number(e.target.value) })} />
            }
            const price = parseFloat(row.getValue("price"))
            const formatted = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", minimumFractionDigits: 0 }).format(price || 0)
            return <div className="text-center font-bold text-xs md:text-sm tracking-tight">{formatted}</div>
        }
    },
    {
        id: "actions",
        size: 100,
        header: ({ table }) => {
            const meta = table.options.meta as TableMeta<MaterialRow>
            return (
                <div className="flex justify-end pr-6">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary/50 hover:text-primary" onClick={() => meta.onInsertRequest?.()}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            )
        },
        cell: ({ row, table }) => <MaterialRowActions row={row} table={table} />
    }
]
