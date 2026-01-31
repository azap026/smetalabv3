"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Pencil, Settings, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Counterparty = {
    id: number
    name: string
    type: "Поставщик" | "Подрядчик"
    contactPerson: string
    phone: string
}

export const columns: ColumnDef<Counterparty>[] = [
    {
        accessorKey: "name",
        header: "Наименование",
        cell: ({ row }) => <div className="font-medium text-xs md:text-sm">{row.getValue("name")}</div>,
    },
    {
        accessorKey: "type",
        header: "Тип",
        cell: ({ row }) => {
            const type = row.getValue("type") as string
            return (
                <Badge variant={type === "Поставщик" ? "default" : "secondary"} className="text-[10px] md:text-xs">
                    {type}
                </Badge>
            )
        },
    },
    {
        accessorKey: "contactPerson",
        header: "Контактное лицо",
        cell: ({ row }) => <div className="text-xs md:text-sm">{row.getValue("contactPerson")}</div>,
    },
    {
        accessorKey: "phone",
        header: "Телефон",
        cell: ({ row }) => <div className="text-xs md:text-sm">{row.getValue("phone")}</div>,
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
