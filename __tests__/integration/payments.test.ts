
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@/lib/db/drizzle';
import { teams } from '@/lib/db/schema';
import { handleSubscriptionChange } from '@/lib/payments/stripe';
import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';

describe('Payments Integration Tests', () => {
    let testTeamId: number;
    const mockStripeCustomerId = `cus_test_${Date.now()}`;
    const mockSubscriptionId = `sub_test_${Date.now()}`;

    beforeEach(async () => {
        // Create a team with a stripe customer ID
        const [team] = await db.insert(teams).values({
            name: 'Payment Test Team',
            stripeCustomerId: mockStripeCustomerId,
        }).returning();
        testTeamId = team.id;
    });

    afterEach(async () => {
        if (testTeamId) {
            await db.delete(teams).where(eq(teams.id, testTeamId));
        }
        vi.resetAllMocks();
    });

    it('should update team subscription status to active', async () => {
        const mockSubscription = {
            id: mockSubscriptionId,
            customer: mockStripeCustomerId,
            status: 'active',
            items: {
                data: [
                    {
                        plan: {
                            product: 'prod_test_123',
                            name: 'Pro Plan'
                        }
                    }
                ]
            }
        } as unknown as Stripe.Subscription;

        await handleSubscriptionChange(mockSubscription);

        const [updatedTeam] = await db.select().from(teams).where(eq(teams.id, testTeamId));
        expect(updatedTeam.subscriptionStatus).toBe('active');
        expect(updatedTeam.stripeSubscriptionId).toBe(mockSubscriptionId);
        expect(updatedTeam.stripeProductId).toBe('prod_test_123');
    });

    it('should clear subscription data when canceled', async () => {
        // Setup initial active subscription
        await db.update(teams).set({
            subscriptionStatus: 'active',
            stripeSubscriptionId: mockSubscriptionId,
        }).where(eq(teams.id, testTeamId));

        const mockCanceledSubscription = {
            id: mockSubscriptionId,
            customer: mockStripeCustomerId,
            status: 'canceled',
            items: { data: [] }
        } as unknown as Stripe.Subscription;

        await handleSubscriptionChange(mockCanceledSubscription);

        const [updatedTeam] = await db.select().from(teams).where(eq(teams.id, testTeamId));
        expect(updatedTeam.subscriptionStatus).toBe('canceled');
        expect(updatedTeam.stripeSubscriptionId).toBeNull();
        expect(updatedTeam.stripeProductId).toBeNull();
    });

    it('should handle team not found gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const mockSubscription = {
            id: 'sub_unknown',
            customer: 'cus_non_existent',
            status: 'active',
            items: { data: [] }
        } as unknown as Stripe.Subscription;

        await handleSubscriptionChange(mockSubscription);

        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Team not found'),
            expect.anything()
        );
        consoleSpy.mockRestore();
    });
});
