import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { permissions, rolePermissions, platformRolePermissions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function GET() {
    try {
        const user = await getUser();

        if (!user || (user.platformRole !== 'superadmin' && !user.isAdmin)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const [allPermissions, tenantRolePerms, platformRolePerms] = await Promise.all([
            db.select().from(permissions).orderBy(permissions.scope, permissions.code),
            db.select().from(rolePermissions),
            db.select().from(platformRolePermissions)
        ]);

        const tenantPermissions = allPermissions.filter(p => p.scope === 'tenant');
        const platformPermissions = allPermissions.filter(p => p.scope === 'platform');

        const tenantRoleMap: Record<string, Record<number, string>> = {
            admin: {},
            estimator: {},
            manager: {},
        };

        const platformRoleMap: Record<string, Record<number, string>> = {
            superadmin: {},
            support: {},
        };

        // Efficiently fill maps
        tenantRolePerms.forEach(rp => {
            if (tenantRoleMap[rp.role]) {
                tenantRoleMap[rp.role][rp.permissionId] = rp.accessLevel;
            }
        });

        platformRolePerms.forEach(prp => {
            if (platformRoleMap[prp.platformRole]) {
                platformRoleMap[prp.platformRole][prp.permissionId] = prp.accessLevel;
            }
        });

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
        const { type, role, permissionId, level } = body; // level: 'none' | 'read' | 'manage'

        if (type === 'tenant') {
            if (level === 'none') {
                await db.delete(rolePermissions).where(
                    and(
                        eq(rolePermissions.role, role),
                        eq(rolePermissions.permissionId, permissionId)
                    )
                );
            } else {
                await db.insert(rolePermissions).values({
                    role: role,
                    permissionId: permissionId,
                    accessLevel: level,
                }).onConflictDoUpdate({
                    target: [rolePermissions.role, rolePermissions.permissionId],
                    set: { accessLevel: level }
                });
            }
        } else if (type === 'platform') {
            if (level === 'none') {
                await db.delete(platformRolePermissions).where(
                    and(
                        eq(platformRolePermissions.platformRole, role),
                        eq(platformRolePermissions.permissionId, permissionId)
                    )
                );
            } else {
                await db.insert(platformRolePermissions).values({
                    platformRole: role,
                    permissionId: permissionId,
                    accessLevel: level,
                }).onConflictDoUpdate({
                    target: [platformRolePermissions.platformRole, platformRolePermissions.permissionId],
                    set: { accessLevel: level }
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating permissions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
