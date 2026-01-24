'use client';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function AppHomePage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold mb-2">Flex vs Grid</h2>
                <p className="text-muted-foreground">Сравнение разметки</p>
            </div>

            <Separator />

            {/* FLEX */}
            <section>
                <h3 className="text-lg font-semibold mb-4">Flex</h3>
                <div className="flex gap-4">
                    <Card>
                        <CardHeader><CardTitle>Карточка 1</CardTitle></CardHeader>
                        <CardContent><p>Контент</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Карточка 2</CardTitle></CardHeader>
                        <CardContent><p>Контент</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Карточка 3</CardTitle></CardHeader>
                        <CardContent><p>Контент</p></CardContent>
                    </Card>
                </div>
            </section>

            <Separator />

            {/* GRID */}
            <section>
                <h3 className="text-lg font-semibold mb-4">Grid</h3>
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardHeader><CardTitle>Карточка 1</CardTitle></CardHeader>
                        <CardContent><p>Контент</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Карточка 2</CardTitle></CardHeader>
                        <CardContent><p>Контент</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Карточка 3</CardTitle></CardHeader>
                        <CardContent><p>Контент</p></CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
}
