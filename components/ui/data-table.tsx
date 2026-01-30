"use client"

import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
    Row,
} from "@tanstack/react-table"
import { ChevronDown, ChevronUp, ChevronsUpDown, Search, Sparkles, Loader2 } from "lucide-react"
import { TableVirtuoso, TableComponents } from "react-virtuoso"
import { useDeferredValue, memo, useMemo, useState, useEffect, useCallback, useTransition, forwardRef, HTMLAttributes } from "react"
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
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { deleteWork, updateWork } from "@/app/actions/works"
import { UnitSelect } from "@/components/unit-select"

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

/* -------------------------------------------------------------------------- */
/*                               DataTable                                    */
/* -------------------------------------------------------------------------- */

export interface TableMeta<TData> {
    onInsertRequest?: (id?: string) => void
    onCancelInsert?: () => void
    onSaveInsert?: (id: string) => void
    updatePlaceholderRow?: (id: string, data: Partial<TData>) => void
    onReorder?: () => void
}

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    height?: string
    filterColumn?: string
    filterPlaceholder?: string
    meta?: TableMeta<TData>
    showAiSearch?: boolean
    onAiSearch?: (query: string) => void
    isAiMode?: boolean
    onAiModeChange?: (val: boolean) => void
    externalSearchValue?: string
    onSearchValueChange?: (val: string) => void
}

// --- Stable Virtuoso Components ---
interface VirtuosoHeader {
    id: string;
    column: {
        columnDef: {
            size?: number;
        };
    };
}

const VirtuosoTableComponents: TableComponents<any, any> = {
    Table: ({ children, style, ...props }) => (
        <table
            {...props}
            style={{
                ...style,
                width: '100%',
                tableLayout: 'fixed',
                borderCollapse: 'separate',
                borderSpacing: 0
            }}
        >
            {children}
        </table>
    ),
    TableHead: forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>((props, ref) => (
        <thead {...props} ref={ref} className="z-40" />
    )),
    TableRow: (props) => (
        <tr {...props} className="border-b last:border-0 hover:bg-muted/30 transition-colors group group/row" />
    ),
    TableBody: forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>((props, ref) => (
        <tbody {...props} ref={ref} />
    )),
};

interface DataTableRowProps<TData> {
    row: Row<TData>;
}

const DataTableRow = memo(({ row }: DataTableRowProps<any>) => {
    return (
        <>
            {row.getVisibleCells().map((cell: any) => (
                <td
                    key={cell.id}
                    className="p-3 align-middle border-b border-r last:border-r-0"
                    style={{ width: cell.column.getSize() }}
                >
                    <div className="w-full text-xs md:text-sm">
                        {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                        )}
                    </div>
                </td>
            ))}
        </>
    );
}, (prev, next) => {
    // Only re-render if the actual row data or selected state changes
    return prev.row.original === next.row.original &&
        prev.row.getIsSelected() === next.row.getIsSelected();
});
DataTableRow.displayName = "DataTableRow";

export function DataTable<TData, TValue>({
    columns,
    data,
    height = "600px",
    filterColumn,
    filterPlaceholder = "Поиск...",
    meta,
    showAiSearch,
    onAiSearch,
    isSearching,
    isAiMode: externalAiMode,
    onAiModeChange,
    externalSearchValue,
    onSearchValueChange,
    onEndReached,
    isLoadingMore,
}: DataTableProps<TData, TValue> & {
    isSearching?: boolean;
    isAiMode?: boolean;
    onAiModeChange?: (val: boolean) => void;
    externalSearchValue?: string;
    onSearchValueChange?: (val: string) => void;
    onEndReached?: () => void;
    isLoadingMore?: boolean;
}) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})
    const [internalAiMode, setInternalAiMode] = useState(false)

    const isAiMode = externalAiMode ?? internalAiMode;
    const setIsAiMode = onAiModeChange ?? setInternalAiMode;

    const [searchValue, setSearchValue] = useState("")
    const deferredSearchValue = useDeferredValue(searchValue)
    const { toast } = useToast()
    const [editingRow, setEditingRow] = useState<any | null>(null)
    const [deletingRow, setDeletingRow] = useState<any | null>(null)
    const [isUpdating, startUpdateTransition] = useTransition()
    const [isDeleting, startDeleteTransition] = useTransition()

    // Form data for editing
    const [editFormData, setEditFormData] = useState<any>(null)

    useEffect(() => {
        if (editingRow) {
            setEditFormData({
                name: editingRow.name || "",
                price: editingRow.price?.toString() || "",
                unit: editingRow.unit || "",
                phase: editingRow.phase || "",
                category: editingRow.category || "",
                subcategory: editingRow.subcategory || "",
            })
        } else {
            setEditFormData(null)
        }
    }, [editingRow])

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingRow || !editFormData) return
        startUpdateTransition(async () => {
            const result = await updateWork(editingRow.id, {
                ...editFormData,
                price: editFormData.price ? Number(editFormData.price) : undefined
            })
            if (result.success) {
                toast({ title: "Запись обновлена", description: result.message })
                setEditingRow(null)
            } else {
                toast({ variant: "destructive", title: "Ошибка", description: result.message })
            }
        })
    }

    const handleDelete = () => {
        if (!deletingRow) return
        startDeleteTransition(async () => {
            const result = await deleteWork(deletingRow.id)
            if (result.success) {
                toast({ title: "Запись удалена", description: result.message })
                setDeletingRow(null)
            } else {
                toast({ variant: "destructive", title: "Ошибка", description: result.message })
            }
        })
    }

    const tableState = useMemo(() => ({
        sorting,
        columnFilters: (isAiMode || externalSearchValue) ? [] : columnFilters,
        columnVisibility,
        rowSelection,
    }), [sorting, columnFilters, isAiMode, externalSearchValue, columnVisibility, rowSelection]);

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getRowId: (row) => (row as { id: string }).id,
        meta: {
            ...meta,
            setEditingRow,
            setDeletingRow
        },
        state: tableState,
    })

    // Unified debounced/deferred search for table filtering
    useEffect(() => {
        if (!isAiMode && filterColumn && !onSearchValueChange) {
            table.getColumn(filterColumn)?.setFilterValue(deferredSearchValue)
        }
    }, [deferredSearchValue, isAiMode, filterColumn, table, onSearchValueChange]);

    // Sync input with table filter (if changed externally)
    useEffect(() => {
        if (!isAiMode && filterColumn) {
            const val = (table.getColumn(filterColumn)?.getFilterValue() as string) ?? "";
            setSearchValue(val);
        }
    }, [columnFilters, isAiMode, filterColumn, table]);

    const { rows } = table.getRowModel()
    const flatHeaders = table.getFlatHeaders();

    const handleSearchClick = useCallback(() => {
        if (searchValue.trim()) {
            setIsAiMode(true)
            onAiSearch?.(searchValue)
        }
    }, [searchValue, onAiSearch, setIsAiMode]);

    return (
        <TooltipProvider>
            <div className="space-y-4">
                {/* Search Filter */}
                {filterColumn && (
                    <div className="flex flex-col sm:flex-row gap-2 px-1 md:px-0 items-stretch sm:items-center">
                        <div className="relative flex-1 sm:max-w-sm">
                            {isSearching ? (
                                <Loader2 className="absolute left-3 h-4 w-4 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin" />
                            ) : (
                                <Search className="absolute left-3 h-4 w-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            )}
                            <Input
                                placeholder={filterPlaceholder}
                                value={searchValue}
                                onChange={(event) => {
                                    const val = event.target.value
                                    setSearchValue(val)
                                    onSearchValueChange?.(val)

                                    if (isAiMode) {
                                        setIsAiMode(false)
                                        onAiSearch?.("")
                                    } else if (val === "") {
                                        onAiSearch?.("")
                                    }
                                }}
                                className={cn(
                                    "pl-9 transition-all duration-200 w-full",
                                    isAiMode && "border-indigo-400 ring-indigo-400 focus-visible:ring-indigo-400"
                                )}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSearchClick()
                                    }
                                }}
                            />
                            {isAiMode && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-bold animate-pulse">
                                    AI MODE
                                </div>
                            )}
                        </div>
                        {showAiSearch && onAiSearch && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={isAiMode ? "default" : "outline"}
                                        size="icon"
                                        disabled={isSearching}
                                        onClick={handleSearchClick}
                                        className={cn(
                                            "shrink-0 transition-all duration-300 w-full sm:w-10",
                                            isAiMode ? "bg-indigo-600 hover:bg-indigo-700 border-indigo-700 shadow-indigo-100 shadow-lg" : "border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50"
                                        )}
                                    >
                                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className={cn("h-4 w-4", isAiMode ? "text-white" : "text-indigo-500")} />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Умный поиск (AI)</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                )}

                {/* Virtualized Table */}
                <div
                    className="rounded-md border bg-card shadow-sm overflow-hidden"
                    style={{ contain: 'layout style paint' }}
                >
                    <TableVirtuoso
                        style={{ height, willChange: 'transform' }}
                        data={rows}
                        context={{ flatHeaders }}
                        components={VirtuosoTableComponents}
                        overscan={800}
                        endReached={onEndReached}
                        fixedHeaderContent={() => (
                            <>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id} className="bg-background shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">
                                        {headerGroup.headers.map((header) => {
                                            const isSortable = header.column.getCanSort()
                                            const sortDirection = header.column.getIsSorted()

                                            return (
                                                <th
                                                    key={header.id}
                                                    className="h-12 px-3 text-left align-middle font-medium text-muted-foreground bg-muted/50 border-b border-r last:border-r-0 transition-colors"
                                                    style={{ width: header.getSize() }}
                                                >
                                                    {header.isPlaceholder ? null : (
                                                        <div
                                                            className={cn(
                                                                "flex items-center gap-2 select-none w-full",
                                                                isSortable && "cursor-pointer hover:text-foreground"
                                                            )}
                                                            onClick={header.column.getToggleSortingHandler()}
                                                        >
                                                            <div className="truncate flex-1 text-xs md:text-sm">
                                                                {flexRender(
                                                                    header.column.columnDef.header,
                                                                    header.getContext()
                                                                )}
                                                            </div>
                                                            {isSortable && (
                                                                <div className="shrink-0 w-4">
                                                                    {sortDirection === "asc" ? (
                                                                        <ChevronUp className="h-4 w-4" />
                                                                    ) : sortDirection === "desc" ? (
                                                                        <ChevronDown className="h-4 w-4" />
                                                                    ) : (
                                                                        <ChevronsUpDown className="h-4 w-4 opacity-30" />
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </th>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </>
                        )}
                        itemContent={(_index, row) => (
                            <DataTableRow row={row} />
                        )}
                    />
                </div>

                {/* Footer / Row Count */}
                <div className="flex items-center justify-between px-1 md:px-0">
                    <div className="text-xs md:text-sm text-muted-foreground font-medium">
                        Всего записей: <span className="text-foreground">{data.length}</span>
                        {table.getFilteredRowModel().rows.length !== data.length && (
                            <> (отфильтровано: <span className="text-foreground">{table.getFilteredRowModel().rows.length}</span>)</>
                        )}
                    </div>
                </div>

                {/* --- Shared Dialog Manager --- */}
                <Dialog open={!!editingRow} onOpenChange={(open) => !open && setEditingRow(null)}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Изменить запись</DialogTitle>
                            <DialogDescription>Внесите изменения и нажмите сохранить.</DialogDescription>
                        </DialogHeader>
                        {editFormData && (
                            <form onSubmit={handleUpdate} className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">Название</Label>
                                    <Input
                                        id="name"
                                        value={editFormData.name}
                                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                        className="col-span-3 h-8 text-sm"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="unit" className="text-right">Ед. изм.</Label>
                                    <div className="col-span-3">
                                        <UnitSelect
                                            value={editFormData.unit || ""}
                                            onChange={(val) => setEditFormData({ ...editFormData, unit: val })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="price" className="text-right">Цена</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={editFormData.price}
                                        onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                                        className="col-span-3 h-8 text-sm"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="phase" className="text-right">Этап</Label>
                                    <Input
                                        id="phase"
                                        value={editFormData.phase}
                                        onChange={(e) => setEditFormData({ ...editFormData, phase: e.target.value })}
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
                        )}
                    </DialogContent>
                </Dialog>

                <AlertDialog open={!!deletingRow} onOpenChange={(open) => !open && setDeletingRow(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Запись "{deletingRow?.name}" будет удалена безвозвратно.
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
        </TooltipProvider >
    )
}
