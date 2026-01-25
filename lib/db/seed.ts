import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import { users, teams, teamMembers } from './schema';
import { hashPassword } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';

async function createStripeProducts() {
  console.log('Creating Stripe products and prices...');

  const baseProduct = await stripe.products.create({
    name: 'Base',
    description: 'Base subscription plan',
  });

  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800, // $8 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Plus subscription plan',
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // $12 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  console.log('Stripe products and prices created successfully.');
}

async function seed() {
  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  console.log(`⏳ Seeding/Resetting test user: ${email}`);

  // 1. Upsert User
  await db
    .insert(users)
    .values({
      email: email,
      passwordHash: passwordHash,
      role: 'member',
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { passwordHash: passwordHash },
    });

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  // 2. Upsert Team
  let [team] = await db.select().from(teams).where(eq(teams.name, 'Test Team')).limit(1);
  if (!team) {
    [team] = await db
      .insert(teams)
      .values({
        name: 'Test Team',
      })
      .returning();
  }

  // 3. Upsert Team Member
  await db
    .insert(teamMembers)
    .values({
      teamId: team.id,
      userId: user.id,
      role: 'admin',
    })
    .onConflictDoNothing();

  console.log('✅ Base seed completed successfully.');

  if (!process.env.CI) {
    await createStripeProducts();
  } else {
    console.log('Skipping Stripe product creation in CI environment.');
  }
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
