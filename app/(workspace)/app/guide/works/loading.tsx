import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <Skeleton className="h-8 w-[150px]" />
                    <Skeleton className="h-4 w-[250px] mt-2" />
                </div>
            </div>
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <div className="rounded-md border">
                    <div className="h-[600px] w-full p-4">
                        <div className="space-y-4">
                            {[...Array(10)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
