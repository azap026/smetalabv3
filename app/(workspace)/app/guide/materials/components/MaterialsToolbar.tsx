import { Button } from '@/components/ui/button';
import { Upload, Download, Trash2, Loader2, Plus, Sparkles } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface MaterialsToolbarProps {
    isImporting: boolean;
    isExporting: boolean;
    isDeletingAll: boolean;
    isGenerating: boolean;
    hasData: boolean;
    handleImportClick: () => void;
    handleExport: () => void;
    handleDeleteAll: () => void;
    handleGenerateEmbeddings: () => void;
    onInsertRequest: () => void;
}

export function MaterialsToolbar({
    isImporting,
    isExporting,
    isDeletingAll,
    isGenerating,
    hasData,
    handleImportClick,
    handleExport,
    handleDeleteAll,
    handleGenerateEmbeddings,
    onInsertRequest
}: MaterialsToolbarProps) {
    return (
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" className="flex-1 md:flex-none h-9 text-xs md:text-sm" onClick={handleImportClick} disabled={isImporting}>
                            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Импорт
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Загрузить данные</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" className="flex-1 md:flex-none h-9 text-xs md:text-sm" onClick={handleGenerateEmbeddings} disabled={isGenerating || isImporting}>
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-indigo-500" />}
                            AI-индекс
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Сгенерировать индексы для умного поиска</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" className="flex-1 md:flex-none h-9 text-xs md:text-sm" onClick={handleExport} disabled={isExporting}>
                            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Экспорт
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Выгрузить данные</p></TooltipContent>
                </Tooltip>

                <AlertDialog>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="flex-1 md:flex-none h-9 text-xs md:text-sm" disabled={isDeletingAll || !hasData}>
                                    {isDeletingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                    Удалить всё
                                </Button>
                            </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent><p>Удалить все материалы</p></TooltipContent>
                    </Tooltip>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                            <AlertDialogDescription>Все материалы будут удалены.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground">Удалить всё</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </TooltipProvider>

            <Button className="flex-1 md:flex-none h-9 text-xs md:text-sm" onClick={onInsertRequest}>
                <Plus className="mr-2 h-4 w-4" /> Добавить
            </Button>
        </div>
    );
}
