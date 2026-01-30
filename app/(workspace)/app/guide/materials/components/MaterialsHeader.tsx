import { Loader2 } from 'lucide-react';

interface MaterialsHeaderProps {
    isLoading: boolean;
    totalCount: number;
}

export function MaterialsHeader({ isLoading, totalCount }: MaterialsHeaderProps) {
    return (
        <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
                Материалы
                <span className="text-muted-foreground font-normal text-xl md:text-2xl">({totalCount.toLocaleString('ru-RU')})</span>
                {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
                Справочник материалов и оборудования
            </p>
        </div>
    );
}
