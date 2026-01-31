'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Loader2 } from 'lucide-react';
import { MaterialRow } from '@/types/material-row';

// Internal Components
import { MaterialsHeader } from './components/MaterialsHeader';
import { MaterialsToolbar } from './components/MaterialsToolbar';
import { MaterialsTableWrapper } from './components/MaterialsTableWrapper';

// Internal Hooks
import { useMaterialsActions } from './hooks/useMaterialsActions';
import { useAiIndexing } from './hooks/useAiIndexing';
import { useMaterialsSearch } from './hooks/useMaterialsSearch';
import { useMaterialsTable } from './hooks/useMaterialsTable';

interface MaterialsClientProps {
    initialData: MaterialRow[];
    totalCount: number;
}

export function MaterialsClient({ initialData, totalCount }: MaterialsClientProps) {
    const [mounted, setMounted] = useState(false);
    const [data, setData] = useState<MaterialRow[]>(initialData);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        setData(initialData);
    }, [initialData]);

    // Initialize hooks
    const actions = useMaterialsActions(data, setData);
    const ai = useAiIndexing();
    const search = useMaterialsSearch(initialData, data, setData);
    const table = useMaterialsTable(data, setData);

    if (!mounted) return null;

    return (
        <div className="space-y-6">
            <input
                type="file"
                ref={actions.fileInputRef}
                onChange={actions.handleFileChange}
                className="hidden"
                accept=".csv, .xlsx, .xls"
            />

            <Breadcrumb className="px-1 md:px-0">
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink href="/app">Главная</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbLink>Справочники</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Материалы</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1 md:px-0">
                <MaterialsHeader isLoading={search.isLoadingMore} totalCount={totalCount} />
                <MaterialsToolbar
                    isImporting={actions.isImporting}
                    isExporting={actions.isExporting}
                    isDeletingAll={actions.isDeletingAll}
                    isGenerating={ai.isGenerating}
                    hasData={data.length > 0}
                    handleImportClick={actions.handleImportClick}
                    handleExport={actions.handleExport}
                    handleDeleteAll={actions.handleDeleteAll}
                    handleGenerateEmbeddings={ai.handleGenerateEmbeddings}
                    onInsertRequest={() => table.onInsertRequest()}
                />
            </div>

            <div className="relative">
                {(actions.isImporting || actions.isInserting) && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-lg">
                        <div className="flex flex-col items-center gap-3 p-6 bg-card border shadow-xl rounded-xl">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-sm font-semibold">{actions.isInserting ? "Сохранение..." : "Импорт..."}</p>
                        </div>
                    </div>
                )}

                <MaterialsTableWrapper
                    data={data}
                    isAiMode={search.isAiMode}
                    isSearching={search.isAiSearching || search.isLoadingMore}
                    searchTerm={search.searchTerm}
                    onAiSearch={search.handleAiSearch}
                    onAiModeChange={search.setIsAiMode}
                    onSearchValueChange={search.setSearchTerm}
                    onEndReached={search.loadMore}
                    isLoadingMore={search.isLoadingMore}
                    tableActions={{
                        onInsertRequest: table.onInsertRequest,
                        onCancelInsert: table.onCancelInsert,
                        onSaveInsert: actions.onSaveInsert,
                        updatePlaceholderRow: table.updatePlaceholderRow
                    }}
                />
            </div>
        </div>
    );
}
