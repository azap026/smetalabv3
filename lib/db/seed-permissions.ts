import { db } from './drizzle';
import { permissions, rolePermissions, platformRolePermissions } from './schema';
import type { TenantRole, PlatformRole, PermissionScope } from './schema';

interface PermissionDef {
    code: string;
    name: string;
    description: string;
    scope: PermissionScope;
}

// ═══════════════════════════════════════════════════════════════
// PERMISSION DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const PERMISSIONS: PermissionDef[] = [
    // ─── TENANT PERMISSIONS ────────────────────────────────────────
    // Estimates
    { code: 'estimates.create', name: 'Create Estimates', description: 'Create new estimates', scope: 'tenant' },
    { code: 'estimates.view', name: 'View Estimates', description: 'View estimates list and details', scope: 'tenant' },
    { code: 'estimates.edit', name: 'Edit Estimates', description: 'Edit existing estimates', scope: 'tenant' },
    { code: 'estimates.delete', name: 'Delete Estimates', description: 'Delete estimates', scope: 'tenant' },
    { code: 'estimates.share', name: 'Share Estimates', description: 'Create and manage share links', scope: 'tenant' },
    { code: 'estimates.export', name: 'Export Estimates', description: 'Export estimates to PDF/Excel', scope: 'tenant' },

    // Projects
    { code: 'projects.create', name: 'Create Projects', description: 'Create new projects', scope: 'tenant' },
    { code: 'projects.view', name: 'View Projects', description: 'View projects list and details', scope: 'tenant' },
    { code: 'projects.edit', name: 'Edit Projects', description: 'Edit existing projects', scope: 'tenant' },
    { code: 'projects.delete', name: 'Delete Projects', description: 'Delete projects', scope: 'tenant' },

    // Materials / Purchases
    { code: 'materials.view', name: 'View Materials', description: 'View materials database', scope: 'tenant' },
    { code: 'materials.manage', name: 'Manage Materials', description: 'Add, edit, delete materials', scope: 'tenant' },
    { code: 'purchases.view', name: 'View Purchases', description: 'View purchase orders', scope: 'tenant' },
    { code: 'purchases.manage', name: 'Manage Purchases', description: 'Create and manage purchase orders', scope: 'tenant' },

    // Team Management
    { code: 'team.view', name: 'View Team', description: 'View team members', scope: 'tenant' },
    { code: 'team.invite', name: 'Invite Members', description: 'Invite new team members', scope: 'tenant' },
    { code: 'team.remove', name: 'Remove Members', description: 'Remove team members', scope: 'tenant' },
    { code: 'team.manage_roles', name: 'Manage Roles', description: 'Change member roles', scope: 'tenant' },

    // Settings
    { code: 'settings.view', name: 'View Settings', description: 'View team settings', scope: 'tenant' },
    { code: 'settings.edit', name: 'Edit Settings', description: 'Edit team settings', scope: 'tenant' },
    { code: 'billing.view', name: 'View Billing', description: 'View billing information', scope: 'tenant' },
    { code: 'billing.manage', name: 'Manage Billing', description: 'Manage subscription and payments', scope: 'tenant' },

    // Activity
    { code: 'activity.view', name: 'View Activity', description: 'View activity logs', scope: 'tenant' },

    // ─── PLATFORM PERMISSIONS ──────────────────────────────────────
    { code: 'platform.dashboard', name: 'Platform Dashboard', description: 'Access platform admin dashboard', scope: 'platform' },
    { code: 'platform.tenants.view', name: 'View Tenants', description: 'View all tenants/teams', scope: 'platform' },
    { code: 'platform.tenants.manage', name: 'Manage Tenants', description: 'Create, edit, suspend tenants', scope: 'platform' },
    { code: 'platform.users.view', name: 'View Users', description: 'View all platform users', scope: 'platform' },
    { code: 'platform.users.manage', name: 'Manage Users', description: 'Edit user accounts, reset passwords', scope: 'platform' },
    { code: 'platform.impersonate', name: 'Impersonate', description: 'Impersonate tenant users for support', scope: 'platform' },
    { code: 'platform.billing.view', name: 'Platform Billing', description: 'View platform billing stats', scope: 'platform' },
    { code: 'platform.settings', name: 'Platform Settings', description: 'Manage platform settings', scope: 'platform' },
    { code: 'platform.activity', name: 'Platform Activity', description: 'View platform-wide activity logs', scope: 'platform' },
];

// ═══════════════════════════════════════════════════════════════
// ROLE → PERMISSION MAPPINGS
// ═══════════════════════════════════════════════════════════════

// Tenant Role Mappings
const TENANT_ROLE_PERMISSIONS: Record<TenantRole, string[]> = {
    admin: [
        // Full access to all tenant features
        'estimates.create', 'estimates.view', 'estimates.edit', 'estimates.delete', 'estimates.share', 'estimates.export',
        'projects.create', 'projects.view', 'projects.edit', 'projects.delete',
        'materials.view', 'materials.manage',
        'purchases.view', 'purchases.manage',
        'team.view', 'team.invite', 'team.remove', 'team.manage_roles',
        'settings.view', 'settings.edit',
        'billing.view', 'billing.manage',
        'activity.view',
    ],
    estimator: [
        // Full access to estimates and projects, view-only for team/settings
        'estimates.create', 'estimates.view', 'estimates.edit', 'estimates.share', 'estimates.export',
        'projects.create', 'projects.view', 'projects.edit',
        'materials.view',
        'purchases.view',
        'team.view',
        'settings.view',
        'activity.view',
    ],
    manager: [
        // View-only for estimates, manage purchases/materials
        'estimates.view', 'estimates.export',
        'projects.view',
        'materials.view', 'materials.manage',
        'purchases.view', 'purchases.manage',
        'team.view',
        'settings.view',
    ],
};

// Platform Role Mappings
const PLATFORM_ROLE_PERMISSIONS: Record<PlatformRole, string[]> = {
    superadmin: [
        // Full platform access
        'platform.dashboard',
        'platform.tenants.view', 'platform.tenants.manage',
        'platform.users.view', 'platform.users.manage',
        'platform.impersonate',
        'platform.billing.view',
        'platform.settings',
        'platform.activity',
    ],
    support: [
        // Limited platform access (no settings, no impersonate in some cases)
        'platform.dashboard',
        'platform.tenants.view',
        'platform.users.view',
        'platform.activity',
    ],
};

// ═══════════════════════════════════════════════════════════════
// SEED FUNCTION
// ═══════════════════════════════════════════════════════════════

async function seedPermissions() {
    console.log('🔐 Seeding permissions...');

    // 1. Insert all permissions
    const insertedPermissions = await db
        .insert(permissions)
        .values(PERMISSIONS)
        .onConflictDoNothing({ target: permissions.code })
        .returning();

    console.log(`   ✓ Inserted ${insertedPermissions.length} permissions`);

    // 2. Get all permissions with their IDs (for mapping)
    const allPermissions = await db.select().from(permissions);
    const permissionMap = new Map(allPermissions.map(p => [p.code, p.id]));

    // 3. Insert tenant role permissions
    console.log('📋 Seeding tenant role permissions...');

    for (const [role, permCodes] of Object.entries(TENANT_ROLE_PERMISSIONS)) {
        const values = permCodes
            .filter(code => permissionMap.has(code))
            .map(code => ({
                role: role as TenantRole,
                permissionId: permissionMap.get(code)!,
            }));

        if (values.length > 0) {
            await db
                .insert(rolePermissions)
                .values(values)
                .onConflictDoNothing();

            console.log(`   ✓ ${role}: ${values.length} permissions`);
        }
    }

    // 4. Insert platform role permissions
    console.log('🏛️  Seeding platform role permissions...');

    for (const [role, permCodes] of Object.entries(PLATFORM_ROLE_PERMISSIONS)) {
        const values = permCodes
            .filter(code => permissionMap.has(code))
            .map(code => ({
                platformRole: role as PlatformRole,
                permissionId: permissionMap.get(code)!,
            }));

        if (values.length > 0) {
            await db
                .insert(platformRolePermissions)
                .values(values)
                .onConflictDoNothing();

            console.log(`   ✓ ${role}: ${values.length} permissions`);
        }
    }

    console.log('✅ Permissions seeded successfully!');
}

// Run if executed directly
seedPermissions()
    .catch((error) => {
        console.error('❌ Seed permissions failed:', error);
        process.exit(1);
    })
    .finally(() => {
        console.log('Seed process finished. Exiting...');
        process.exit(0);
    });

export { seedPermissions, PERMISSIONS, TENANT_ROLE_PERMISSIONS, PLATFORM_ROLE_PERMISSIONS };
