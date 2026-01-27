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
import { ChevronDown, ChevronUp, ChevronsUpDown, Search } from "lucide-react"
import { TableVirtuoso } from "react-virtuoso"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

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
}

export function DataTable<TData, TValue>({
    columns,
    data,
    height = "600px",
    filterColumn,
    filterPlaceholder = "Поиск...",
    meta,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    )
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})

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
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    const { rows } = table.getRowModel()

    // Components mapping for Virtuoso to maintain table structure and alignment
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

    return (
        <div className="space-y-4">
            {/* Search Filter */}
            {filterColumn && (
                <div className="relative flex items-center px-1 md:px-0">
                    <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={filterPlaceholder}
                        value={(table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn(filterColumn)?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm pl-9"
                    />
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
                                                        <div className="truncate flex-1">
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
