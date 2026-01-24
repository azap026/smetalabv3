import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function PermissionsPage() {
    return (
        <section className="flex-1 p-4 lg:p-8">
            <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
                Управление разрешениями
            </h1>
            <Card>
                <CardHeader>
                    <CardTitle>Матрица ролей и доступов</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center text-center py-12">
                        <Shield className="h-12 w-12 text-orange-500 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Coming Soon
                        </h3>
                        <p className="text-sm text-gray-500 max-w-sm">
                            Интерфейс для настройки разрешений ролей на уровне платформы и тенантов находится в разработке.
                            Текущие настройки заданы через базу данных (seed).
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
