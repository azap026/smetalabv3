/**
 * Script to create a new user
 *
 * Usage:
 *   pnpm db:create-user <email> <password>
 */

import { db } from './drizzle';
import { users } from './schema';
import { hashPassword } from '../auth/session';

async function createUser() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log('❌ Usage: pnpm db:create-user <email> <password>');
        process.exit(1);
    }

    const [email, password] = args;
    const passwordHash = await hashPassword(password);

    await db.insert(users).values({
        email,
        passwordHash,
        name: 'Super Admin',
    });

    console.log(`✅ Successfully created user: ${email}`);
}

createUser()
    .catch((error) => {
        console.error('❌ Failed to create user:', error);
        process.exit(1);
    })
    .finally(() => {
        process.exit(0);
    });
