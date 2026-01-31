/**
 * Script to reset user password
 * 
 * Usage:
 *   pnpm db:reset-password <email> <new-password>
 * 
 * Example:
 *   pnpm db:reset-password admin@example.com newpassword123
 */

import { db } from './drizzle';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/session';

async function resetPassword() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log('❌ Usage: pnpm db:reset-password <email> <new-password>');
        console.log('');
        console.log('Example:');
        console.log('  pnpm db:reset-password admin@example.com newpassword123');
        process.exit(1);
    }

    const [email, newPassword] = args;

    if (newPassword.length < 6) {
        console.error('❌ Password must be at least 6 characters');
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

    // Hash and update password
    const passwordHash = await hashPassword(newPassword);

    await db
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, user.id));

    console.log(`✅ Password successfully reset for ${email}`);
    console.log('');
    console.log('You can now login with:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${newPassword}`);
}

resetPassword()
    .catch((error) => {
        console.error('❌ Failed to reset password:', error);
        process.exit(1);
    })
    .finally(() => {
        process.exit(0);
    });
