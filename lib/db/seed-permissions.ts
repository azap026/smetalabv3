import { db } from './drizzle';
import { permissions, rolePermissions, platformRolePermissions } from './schema';
import type { TenantRole, PlatformRole, PermissionScope } from './schema';

interface PermissionDef {
    code: string;
    name: string;
    description: string;
    scope: PermissionScope;
}

const PERMISSIONS: PermissionDef[] = [
    { code: 'projects', name: 'Проекты', description: 'Доступ к разделу проектов и смет', scope: 'tenant' },
    { code: 'team', name: 'Команда', description: 'Управление участниками и приглашениями', scope: 'tenant' },
    { code: 'guide', name: 'Справочники', description: 'Доступ к базе материалов, работ и контрагентов', scope: 'tenant' },
    { code: 'settings', name: 'Настройки', description: 'Настройка тенанта и платежная информация', scope: 'tenant' },

    { code: 'platform.tenants', name: 'Организации', description: 'Управление всеми тенантами платформы', scope: 'platform' },
    { code: 'platform.permissions', name: 'Права доступа', description: 'Глобальное управление матрицей ролей', scope: 'platform' },
    { code: 'platform.activity', name: 'Активность', description: 'Мониторинг действий всех пользователей', scope: 'platform' },
];

const TENANT_ROLE_PERMISSIONS: Record<TenantRole, Record<string, 'read' | 'manage'>> = {
    admin: {
        'projects': 'manage',
        'team': 'manage',
        'guide': 'manage',
        'settings': 'manage',
    },
    estimator: {
        'projects': 'manage',
        'team': 'read',
        'guide': 'manage',
        'settings': 'read',
    },
    manager: {
        'projects': 'read',
        'team': 'read',
        'guide': 'read',
    },
};

const PLATFORM_ROLE_PERMISSIONS: Record<PlatformRole, Record<string, 'read' | 'manage'>> = {
    superadmin: {
        'platform.tenants': 'manage',
        'platform.permissions': 'manage',
        'platform.activity': 'manage',
    },
    support: {
        'platform.tenants': 'read',
        'platform.activity': 'read',
    },
};

async function seedPermissions() {
    console.log('🧹 Cleaning up old permissions...');
    await db.delete(platformRolePermissions);
    await db.delete(rolePermissions);
    await db.delete(permissions);

    console.log('🔐 Seeding feature-based permissions (3-state model)...');

    // 1. Insert permissions
    await db.insert(permissions).values(PERMISSIONS);
    const allPermissions = await db.select().from(permissions);
    const permissionMap = new Map(allPermissions.map(p => [p.code, p.id]));

    // 2. Tenant roles
    for (const [role, features] of Object.entries(TENANT_ROLE_PERMISSIONS)) {
        const values = Object.entries(features).map(([code, level]) => ({
            role: role as TenantRole,
            permissionId: permissionMap.get(code)!,
            accessLevel: level as 'read' | 'manage'
        }));
        if (values.length > 0) await db.insert(rolePermissions).values(values);
    }

    // 3. Platform roles
    for (const [role, features] of Object.entries(PLATFORM_ROLE_PERMISSIONS)) {
        const values = Object.entries(features).map(([code, level]) => ({
            platformRole: role as PlatformRole,
            permissionId: permissionMap.get(code)!,
            accessLevel: level as 'read' | 'manage'
        }));
        if (values.length > 0) await db.insert(platformRolePermissions).values(values);
    }

    console.log('✅ 3-state permissions seeded successfully!');
}

seedPermissions()
    .catch((error) => {
        console.error('❌ Failed:', error);
        process.exit(1);
    })
    .finally(() => process.exit(0));
