import { DataTable } from "@/components/ui/data-table";
import { columns } from "../columns";
import { MaterialRow } from '@/types/material-row';

interface MaterialsTableWrapperProps {
    data: MaterialRow[];
    isAiMode: boolean;
    isSearching: boolean;
    searchTerm: string;
    onAiSearch: (query: string) => void;
    onAiModeChange: (val: boolean) => void;
    onSearchValueChange: (val: string) => void;
    onEndReached?: () => void;
    isLoadingMore?: boolean;
    tableActions: {
        onInsertRequest: (afterId?: string) => void;
        onCancelInsert: () => void;
        onSaveInsert: (id: string) => void;
        updatePlaceholderRow: (id: string, partial: Partial<MaterialRow>) => void;
    };
}

export function MaterialsTableWrapper({
    data,
    isAiMode,
    isSearching,
    searchTerm,
    onAiSearch,
    onAiModeChange,
    onSearchValueChange,
    onEndReached,
    isLoadingMore,
    tableActions
}: MaterialsTableWrapperProps) {
    return (
        <DataTable
            columns={columns}
            data={data}
            height="600px"
            filterColumn="name"
            filterPlaceholder="Поиск по наименованию..."
            showAiSearch={true}
            onAiSearch={onAiSearch}
            isAiMode={isAiMode}
            onAiModeChange={onAiModeChange}
            isSearching={isSearching}
            externalSearchValue={searchTerm}
            onSearchValueChange={onSearchValueChange}
            onEndReached={onEndReached}
            isLoadingMore={isLoadingMore}
            meta={{
                onInsertRequest: tableActions.onInsertRequest,
                onCancelInsert: tableActions.onCancelInsert,
                onSaveInsert: tableActions.onSaveInsert,
                updatePlaceholderRow: tableActions.updatePlaceholderRow
            }}
        />
    );
}
