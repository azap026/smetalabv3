"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Pencil, Settings, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Work } from "@/lib/db/schema"

export const columns: ColumnDef<Work>[] = [
    {
        accessorKey: "code",
        header: "Код",
        cell: ({ row }) => <div className="w-[100px] md:w-[120px] font-medium text-xs md:text-sm">{row.getValue("code")}</div>,
    },
    {
        accessorKey: "name",
        header: "Наименование",
        cell: ({ row }) => <div className="text-xs md:text-sm font-medium">{row.getValue("name")}</div>,
    },
    {
        accessorKey: "unit",
        header: () => <div className="text-center">Ед. изм.</div>,
        cell: ({ row }) => <div className="w-[80px] md:w-[100px] text-center text-xs md:text-sm">{row.getValue("unit")}</div>,
    },
    {
        accessorKey: "price",
        header: () => <div className="text-center">Цена</div>,
        cell: ({ row }) => {
            const price = parseFloat(row.getValue("price"))
            const formatted = new Intl.NumberFormat("ru-RU", {
                style: "currency",
                currency: "RUB",
                minimumFractionDigits: 0,
            }).format(price)

            return <div className="w-[100px] md:w-[140px] text-center font-bold text-xs md:text-sm">{formatted}</div>
        },
    },
    {
        id: "actions",
        cell: () => {
            return (
                <div className="w-[50px] md:w-[60px] text-right pr-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-70 group-hover:opacity-100 transition-opacity">
                                <Settings className="h-4 w-4" />
                                <span className="sr-only">Настройки</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem className="cursor-pointer">
                                <Pencil className="mr-2 h-4 w-4" />
                                Изменить
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                                <Trash className="mr-2 h-4 w-4" />
                                Удалить
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        },
    },
]
