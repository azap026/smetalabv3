import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { generateMissingEmbeddings } from '@/app/actions/materials';

export function useAiIndexing() {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateEmbeddings = async () => {
        setIsGenerating(true);
        toast({ title: "Генерация AI-индексов", description: "Начинаем обработку... (это может занять время)" });

        try {
            let done = false;
            let totalProcessed = 0;

            while (!done) {
                const res = await generateMissingEmbeddings();
                if (!res.success) {
                    toast({ variant: "destructive", title: "Ошибка", description: res.message });
                    break;
                }

                if (res.data.processed === 0 && res.data.remaining === 0) {
                    done = true;
                    toast({ title: "Готово", description: "Все материалы проиндексированы." });
                } else {
                    totalProcessed += res.data.processed;
                    if (totalProcessed % 200 === 0) {
                        toast({ title: "Обработка...", description: `Обработано: ${totalProcessed}. Осталось: ${res.data.remaining}` });
                    }
                    if (res.data.remaining === 0) {
                        done = true;
                        toast({ title: "Успех", description: `Завершено. Обработано ${totalProcessed} записей.` });
                    }
                }
            }
        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", title: "Ошибка", description: "Сбой процесса." });
        } finally {
            setIsGenerating(false);
        }
    };

    return {
        isGenerating,
        handleGenerateEmbeddings
    };
}
