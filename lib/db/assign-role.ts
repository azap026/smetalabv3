/**
 * Script to assign platform roles to users
 * 
 * Usage:
 *   pnpm db:assign-role <email> <role>
 * 
 * Examples:
 *   pnpm db:assign-role admin@example.com superadmin
 *   pnpm db:assign-role support@example.com support
 */

import { db } from './drizzle';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import type { PlatformRole } from './schema';

const VALID_ROLES: PlatformRole[] = ['superadmin', 'support'];

async function assignPlatformRole() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log('❌ Usage: pnpm db:assign-role <email> <role>');
        console.log('');
        console.log('Available roles:');
        console.log('  superadmin - Full platform access, can impersonate tenants');
        console.log('  support    - Limited platform access for customer support');
        console.log('');
        console.log('Example:');
        console.log('  pnpm db:assign-role admin@example.com superadmin');
        process.exit(1);
    }

    const [email, role] = args;

    if (!VALID_ROLES.includes(role as PlatformRole)) {
        console.error(`❌ Invalid role: ${role}`);
        console.log(`Valid roles: ${VALID_ROLES.join(', ')}`);
        process.exit(1);
    }

    // Find user
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

    if (!user) {
        console.error(`❌ User not found: ${email}`);
        process.exit(1);
    }

    // Update role
    await db
        .update(users)
        .set({
            platformRole: role as PlatformRole,
            isAdmin: role === 'superadmin' // Also set legacy isAdmin flag
        })
        .where(eq(users.id, user.id));

    console.log(`✅ Successfully assigned "${role}" role to ${email}`);
    console.log('');
    console.log('User details:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name || '(not set)'}`);
    console.log(`  Previous Platform Role: ${user.platformRole || '(none)'}`);
    console.log(`  New Platform Role: ${role}`);
}

assignPlatformRole()
    .catch((error) => {
        console.error('❌ Failed to assign role:', error);
        process.exit(1);
    })
    .finally(() => {
        process.exit(0);
    });
