"use client"

import * as React from "react"
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
} from "@tanstack/react-table"
import { ChevronDown, ChevronUp, ChevronsUpDown, Search, Sparkles, Loader2 } from "lucide-react"
import { TableVirtuoso } from "react-virtuoso"

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
}

export function DataTable<TData, TValue>({
    columns,
    data,
    height = "600px",
    filterColumn,
    filterPlaceholder = "Поиск...",
    meta,
    showAiSearch,
    onAiSearch,
    isSearching
}: DataTableProps<TData, TValue> & { isSearching?: boolean }) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [isAiMode, setIsAiMode] = React.useState(false)

    // Local state for input to allow "AI Mode" to ignore table filters while keeping text
    const initialFilterValue = filterColumn ? "" : "";
    const [searchValue, setSearchValue] = React.useState(initialFilterValue)

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
        meta,
        state: {
            sorting,
            // If we are in AI mode, we explicitly pass no filters to the engine 
            // so it shows all server-returned results
            columnFilters: isAiMode ? [] : columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    // Sync local input value with table filter when entering normal mode
    // or when filters are changed from outside
    React.useEffect(() => {
        if (!isAiMode && filterColumn) {
            const currentFilter = (table.getColumn(filterColumn)?.getFilterValue() as string) ?? "";
            setSearchValue(currentFilter);
        }
    }, [columnFilters, isAiMode, filterColumn, table]);

    const { rows } = table.getRowModel()

    // Components mapping for Virtuoso
    const TableComponents = React.useMemo(() => ({
        Table: ({ children, style, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
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
                <colgroup>
                    {table.getFlatHeaders().map((header) => (
                        <col
                            key={header.id}
                            style={{ width: header.column.columnDef.size ? `${header.column.columnDef.size}px` : 'auto' }}
                        />
                    ))}
                </colgroup>
                {children}
            </table>
        ),
        TableHead: React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>((props, ref) => (
            <thead {...props} ref={ref} className="z-40" />
        )),
        TableRow: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
            <tr {...props} className="border-b last:border-0 hover:bg-muted/30 transition-colors group group/row" />
        ),
        TableBody: React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>((props, ref) => (
            <tbody {...props} ref={ref} />
        )),
    }), [table])

    const handleSearchClick = () => {
        if (searchValue && showAiSearch && onAiSearch) {
            setIsAiMode(true)
            onAiSearch(searchValue)
        }
    }

    return (
        <div className="space-y-4">
            {/* Search Filter */}
            {filterColumn && (
                <div className="relative flex items-center px-1 md:px-0 gap-2">
                    <div className="relative flex-1 max-w-sm">
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
                                setIsAiMode(false)
                                table.getColumn(filterColumn)?.setFilterValue(val)
                            }}
                            className={cn(
                                "pl-9 transition-all duration-200",
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
                        <Button
                            variant={isAiMode ? "default" : "outline"}
                            size="icon"
                            disabled={isSearching}
                            onClick={handleSearchClick}
                            title="Умный поиск (AI)"
                            className={cn(
                                "shrink-0 transition-all duration-300",
                                isAiMode ? "bg-indigo-600 hover:bg-indigo-700 border-indigo-700 shadow-indigo-100 shadow-lg" : "border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50"
                            )}
                        >
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className={cn("h-4 w-4", isAiMode ? "text-white" : "text-indigo-500")} />}
                        </Button>
                    )}
                </div>
            )}

            {/* Virtualized Table */}
            <div className="rounded-md border shadow-sm bg-card overflow-hidden">
                <TableVirtuoso
                    style={{ height }}
                    data={rows}
                    components={TableComponents}
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
                        <>
                            {row.getVisibleCells().map((cell) => (
                                <td
                                    key={cell.id}
                                    className="p-3 align-middle border-b border-r last:border-r-0 overflow-hidden"
                                >
                                    <div className="truncate w-full text-xs md:text-sm">
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </div>
                                </td>
                            ))}
                        </>
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
        </div>
    )
}
