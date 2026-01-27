import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/drizzle';
import { users, teams, permissions } from '@/lib/db/schema';
import { hasPermission } from '@/lib/auth/rbac';
import { sql } from 'drizzle-orm';

const testAdmin = { id: 8888, name: 'Super Admin', email: 'super@test.com', platformRole: 'superadmin', passwordHash: 'hash' } as any;
const testTeam = { id: 8888, name: 'Test Team 8888' } as any;
const permCode = 'test.perm.8888';

describe('RBAC Security Regression', () => {
    beforeEach(async () => {
        // cleanup
        await db.execute(sql`DELETE FROM users WHERE id = ${testAdmin.id}`);
        await db.execute(sql`DELETE FROM teams WHERE id = ${testTeam.id}`);
        await db.execute(sql`DELETE FROM permissions WHERE code = ${permCode}`);

        // setup
        await db.insert(users).values(testAdmin);
        await db.insert(teams).values(testTeam);
        await db.insert(permissions).values({ code: permCode, name: 'P', scope: 'tenant' });
    });

    it('should NOT grant access to superadmin with INVALID impersonation session', async () => {
        const authorized = await hasPermission(
            testAdmin.id,
            testTeam.id,
            permCode,
            'read',
            { impersonationSessionId: 'invalid-token' }
        );
        expect(authorized).toBe(false);
    });
});
