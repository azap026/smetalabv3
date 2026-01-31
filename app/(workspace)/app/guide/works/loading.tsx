import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Breadcrumb Skeleton */}
            <div className="flex items-center gap-2 px-1 md:px-0">
                <Skeleton className="h-4 w-16" />
                <div className="h-4 w-2 text-muted-foreground/30">/</div>
                <Skeleton className="h-4 w-24" />
                <div className="h-4 w-2 text-muted-foreground/30">/</div>
                <Skeleton className="h-4 w-16" />
            </div>

            {/* Header Skeleton */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1 md:px-0">
                <div>
                    <Skeleton className="h-8 w-32 md:h-9" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-28" />
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2 px-1 md:px-0">
                    <Skeleton className="h-10 flex-1 sm:max-w-sm" />
                    <Skeleton className="h-10 w-10 shrink-0" />
                </div>
                <div className="rounded-md border bg-card">
                    <div className="h-[600px] w-full p-4 space-y-4">
                        <div className="border-b pb-4 flex gap-4">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 flex-1" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="flex gap-4 items-center">
                                <Skeleton className="h-10 w-20 shrink-0" />
                                <Skeleton className="h-10 flex-1" />
                                <Skeleton className="h-10 w-16 shrink-0" />
                                <Skeleton className="h-10 w-24 shrink-0" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
