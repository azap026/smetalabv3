import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { permissions, rolePermissions, platformRolePermissions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function GET() {
    try {
        const user = await getUser();

        if (!user || (user.platformRole !== 'superadmin' && !user.isAdmin)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Get all permissions
        const allPermissions = await db.select().from(permissions).orderBy(permissions.scope, permissions.code);

        // Get tenant role permissions
        const tenantRolePerms = await db.select().from(rolePermissions);

        // Get platform role permissions
        const platformRolePerms = await db.select().from(platformRolePermissions);

        // Group permissions by scope
        const tenantPermissions = allPermissions.filter(p => p.scope === 'tenant');
        const platformPermissions = allPermissions.filter(p => p.scope === 'platform');

        // Build role permission maps
        const tenantRoleMap: Record<string, number[]> = {
            admin: [],
            estimator: [],
            manager: [],
        };

        for (const rp of tenantRolePerms) {
            if (tenantRoleMap[rp.role]) {
                tenantRoleMap[rp.role].push(rp.permissionId);
            }
        }

        const platformRoleMap: Record<string, number[]> = {
            superadmin: [],
            support: [],
        };

        for (const prp of platformRolePerms) {
            if (platformRoleMap[prp.platformRole]) {
                platformRoleMap[prp.platformRole].push(prp.permissionId);
            }
        }

        return NextResponse.json({
            tenantPermissions,
            platformPermissions,
            tenantRoleMap,
            platformRoleMap,
            tenantRoles: ['admin', 'estimator', 'manager'],
            platformRoles: ['superadmin', 'support'],
        });
    } catch (error) {
        console.error('Error fetching permissions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const user = await getUser();

        if (!user || user.platformRole !== 'superadmin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { type, role, permissionId, enabled } = body;

        if (type === 'tenant') {
            if (enabled) {
                await db.insert(rolePermissions).values({
                    role: role,
                    permissionId: permissionId,
                }).onConflictDoNothing();
            } else {
                await db.delete(rolePermissions).where(
                    eq(rolePermissions.id,
                        (await db.select({ id: rolePermissions.id }).from(rolePermissions)
                            .where(eq(rolePermissions.role, role))
                            .then(rows => rows.find(r => r.id)?.id ?? 0))
                    )
                );
                // More precise delete
                const existing = await db.select().from(rolePermissions)
                    .where(eq(rolePermissions.role, role));
                const toDelete = existing.find(e => e.permissionId === permissionId);
                if (toDelete) {
                    await db.delete(rolePermissions).where(eq(rolePermissions.id, toDelete.id));
                }
            }
        } else if (type === 'platform') {
            if (enabled) {
                await db.insert(platformRolePermissions).values({
                    platformRole: role,
                    permissionId: permissionId,
                }).onConflictDoNothing();
            } else {
                const existing = await db.select().from(platformRolePermissions)
                    .where(eq(platformRolePermissions.platformRole, role));
                const toDelete = existing.find(e => e.permissionId === permissionId);
                if (toDelete) {
                    await db.delete(platformRolePermissions).where(eq(platformRolePermissions.id, toDelete.id));
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating permissions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
