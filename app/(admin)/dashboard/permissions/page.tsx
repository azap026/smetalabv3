import { PermissionsMatrix } from '@/components/permissions-matrix';

export default function PermissionsPage() {
    return (
        <section className="flex-1 p-4 lg:p-8">
            <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
                Управление разрешениями
            </h1>
            <PermissionsMatrix />
        </section>
    );
}
