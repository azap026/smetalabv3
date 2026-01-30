import { useState, useEffect, useRef } from 'react';
import { searchMaterials, fetchMoreMaterials } from '@/app/actions/materials';
import { MaterialRow } from '@/types/material-row';
import { useToast } from "@/components/ui/use-toast";
import { useTransition } from 'react';

export function useMaterialsSearch(
    initialData: MaterialRow[],
    data: MaterialRow[],
    setData: React.Dispatch<React.SetStateAction<MaterialRow[]>>
) {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAiMode, setIsAiMode] = useState(false);
    const [isAiSearching, startAiSearchTransition] = useTransition();
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Prevent initial reset clobbering data
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
                const res = await fetchMoreMaterials({ query: searchTerm });
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
            const result = await searchMaterials(query);
            if (result.success) {
                setData(result.data as MaterialRow[]);
                setHasMore(false); // Semantic search usually returns fixed top-K
            } else {
                toast({ variant: "destructive", title: "Ошибка поиска", description: result.message });
            }
        });
    };

    const loadMore = async () => {
        if (isLoadingMore || !hasMore || isAiMode) return;

        setIsLoadingMore(true);
        const lastItem = data[data.length - 1];
        const res = await fetchMoreMaterials({
            query: searchTerm,
            lastCode: lastItem?.code
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
