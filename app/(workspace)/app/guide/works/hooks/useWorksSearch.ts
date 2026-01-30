import { useState, useEffect, useRef } from 'react';
import { searchWorks } from '@/app/actions/works';
import { fetchMoreWorks } from '@/app/actions/works/search';
import { WorkRow } from '@/types/work-row';
import { useToast } from "@/components/ui/use-toast";
import { useTransition } from 'react';

export function useWorksSearch(
    initialData: WorkRow[],
    data: WorkRow[],
    setData: React.Dispatch<React.SetStateAction<WorkRow[]>>
) {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAiMode, setIsAiMode] = useState(false);
    const [isAiSearching, startAiSearchTransition] = useTransition();
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const isMounted = useRef(false);

    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }

        if (isAiMode || isAiSearching) return;

        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length >= 2) {
                setIsLoadingMore(true);
                const res = await fetchMoreWorks({ query: searchTerm });
                if (res.success) {
                    setData(res.data);
                    setHasMore(res.data.length === 5);
                }
                setIsLoadingMore(false);
            } else if (searchTerm.length === 0) {
                setData(initialData);
                setHasMore(initialData.length >= 5);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, initialData, isAiSearching, isAiMode, setData]);

    const handleAiSearch = async (query: string) => {
        if (!query || query.length < 2) {
            setIsAiMode(false);
            setData(initialData);
            return;
        }

        setIsAiMode(true);
        startAiSearchTransition(async () => {
            const result = await searchWorks(query);
            if (result.success) {
                setData(result.data as WorkRow[]);
                setHasMore(false);
            } else {
                toast({ variant: "destructive", title: "Ошибка поиска", description: result.message });
            }
        });
    };

    const loadMore = async () => {
        if (isLoadingMore || !hasMore || isAiMode) return;

        setIsLoadingMore(true);
        const lastItem = data[data.length - 1];
        const res = await fetchMoreWorks({
            query: searchTerm,
            lastSortOrder: lastItem?.sortOrder
        });

        if (res.success && res.data.length > 0) {
            setData(prev => [...prev, ...res.data]);
            setHasMore(res.data.length === 5);
        } else {
            setHasMore(false);
        }
        setIsLoadingMore(false);
    };

    return {
        searchTerm,
        setSearchTerm,
        isAiMode,
        setIsAiMode,
        isAiSearching,
        isLoadingMore,
        handleAiSearch,
        loadMore
    };
}
