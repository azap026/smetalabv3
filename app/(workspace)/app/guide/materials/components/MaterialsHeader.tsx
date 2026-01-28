import { Loader2 } from 'lucide-react';

interface MaterialsHeaderProps {
    isLoading: boolean;
}

export function MaterialsHeader({ isLoading }: MaterialsHeaderProps) {
    return (
        <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
                Материалы
                {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
                Справочник материалов и оборудования {isLoading && "(загрузка полного списка...)"}
            </p>
        </div>
    );
}
