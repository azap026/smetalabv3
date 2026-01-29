import { useState, useEffect, useRef } from 'react';
import { searchMaterials, fetchMoreMaterials } from '@/app/actions/materials';
import { MaterialRow } from '@/types/material-row';
import { useToast } from "@/components/ui/use-toast";
import { useTransition } from 'react';

export function useMaterialsSearch(initialData: MaterialRow[], setData: React.Dispatch<React.SetStateAction<MaterialRow[]>>) {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAiMode, setIsAiMode] = useState(false);
    const [isAiSearching, startAiSearchTransition] = useTransition();
    const [isLoadingMore, setIsLoadingMore] = useState(false);

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
                const res = await fetchMoreMaterials(searchTerm);
                if (res.success) {
                    setData(res.data);
                }
                setIsLoadingMore(false);
            } else if (searchTerm.length === 0) {
                setData(initialData);
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
            } else {
                toast({ variant: "destructive", title: "Ошибка поиска", description: result.message });
            }
        });
    };

    return {
        searchTerm,
        setSearchTerm,
        isAiMode,
        setIsAiMode,
        isAiSearching,
        isLoadingMore,
        handleAiSearch
    };
}
