
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { db } from '@/lib/db/drizzle';
import { materials, users, teams, teamMembers, NewMaterial } from '@/lib/db/schema';
import { createMaterial, updateMaterial, deleteMaterial, deleteAllMaterials } from '@/app/actions/materials/crud';
import { and, eq } from 'drizzle-orm';
import { getUser, getTeamForUser } from '@/lib/db/queries';

// ---------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------

// Mock revalidatePath to avoid Next.js cache errors in tests
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/lib/ai/embeddings', () => ({
    generateEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
    generateEmbeddingsBatch: vi.fn().mockResolvedValue([new Array(1536).fill(0.1)]),
}));

// Mock the auth queries to simulate a logged-in user
vi.mock('@/lib/db/queries', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as object),
        getUser: vi.fn(),
        getTeamForUser: vi.fn(),
    };
});

// ---------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------

describe('Materials Integration Tests', () => {
    let testUserId: number;
    let testTeamId: number;

    const setupUserAndTeam = async () => {
        // 1. Create a user
        const [user] = await db.insert(users).values({
            name: 'Test Material User',
            email: `material-test-${Date.now()}@test.com`,
            passwordHash: 'hashed_password',
            role: 'member',
        }).returning();
        testUserId = user.id;

        // 2. Create a team
        const [team] = await db.insert(teams).values({
            name: 'Material Test Team'
        }).returning();
        testTeamId = team.id;

        // 3. Link user to team
        await db.insert(teamMembers).values({
            userId: testUserId,
            teamId: testTeamId,
            role: 'admin',
        });

        // 4. Mock the session queries to return this user/team
        vi.mocked(getUser).mockResolvedValue(user);
        vi.mocked(getTeamForUser).mockResolvedValue(team as unknown as Awaited<ReturnType<typeof getTeamForUser>>);

        return { user, team };
    };

    const cleanupArgs = async () => {
        if (testTeamId) {
            await db.delete(materials).where(eq(materials.tenantId, testTeamId));
            await db.delete(teamMembers).where(eq(teamMembers.teamId, testTeamId));
            await db.delete(teams).where(eq(teams.id, testTeamId));
        }
        if (testUserId) {
            await db.delete(users).where(eq(users.id, testUserId));
        }
        vi.resetAllMocks();
    };

    beforeEach(async () => {
        await setupUserAndTeam();
    });

    afterEach(async () => {
        await cleanupArgs();
    });

    // -----------------------------------------------------------------
    // Happy Path Tests
    // -----------------------------------------------------------------

    it('should_create_material_when_data_is_valid', async () => {
        // Arrange
        const newMaterialData: NewMaterial = {
            code: 'M-001',
            name: 'Test Material',
            unit: 'pcs',
            price: 100,
            tenantId: testTeamId, // Usually injected by the service/action, but good to be explicit if needed by validation
        };

        // Act
        const result = await createMaterial(newMaterialData);

        // Assert
        expect(result.success).toBe(true);

        // Verify DB
        // Since createAction returns void, we query by the unique code we just inserted
        const inDb = await db.select().from(materials).where(and(eq(materials.code, 'M-001'), eq(materials.tenantId, testTeamId)));
        expect(inDb).toHaveLength(1);
        expect(inDb[0].name).toBe('Test Material');
    });

    it('should_update_material_successfully', async () => {
        // Arrange
        const [created] = await db.insert(materials).values({
            tenantId: testTeamId,
            code: 'M-UPDATE',
            name: 'Original Name',
            price: 50
        }).returning();

        // Act
        const result = await updateMaterial(created.id, { name: 'Updated Name', price: 75 });

        // Assert
        expect(result.success).toBe(true);

        const updated = await db.select().from(materials).where(eq(materials.id, created.id));
        expect(updated[0].name).toBe('Updated Name');
        expect(updated[0].price).toBe(75);
    });

    it('should_delete_material_successfully', async () => {
        // Arrange
        const [created] = await db.insert(materials).values({
            tenantId: testTeamId,
            code: 'M-DELETE',
            name: 'To Delete'
        }).returning();

        // Act
        const result = await deleteMaterial(created.id);

        // Assert
        expect(result.success).toBe(true);

        const inDb = await db.select().from(materials).where(eq(materials.id, created.id));
        expect(inDb).toHaveLength(0); // Assuming hard delete, or check deletedAt if soft delete
    });

    it('should_delete_all_materials_for_tenant', async () => {
        // Arrange
        await db.insert(materials).values([
            { tenantId: testTeamId, code: 'M-1', name: 'M1' },
            { tenantId: testTeamId, code: 'M-2', name: 'M2' },
        ]);

        // Act
        const result = await deleteAllMaterials();

        // Assert
        expect(result.success).toBe(true);
        const inDb = await db.select().from(materials).where(eq(materials.tenantId, testTeamId));
        expect(inDb).toHaveLength(0);
    });

    // -----------------------------------------------------------------
    // Error / Edge Case Tests
    // -----------------------------------------------------------------

    it('should_fail_when_user_is_not_authenticated', async () => {
        // Arrange
        vi.mocked(getUser).mockResolvedValue(null);

        // Act
        const result = await createMaterial({ code: 'FAIL', name: 'Fail', tenantId: testTeamId });

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.code).toBe('UNAUTHORIZED');
        }
    });

    // Sentry Integration Suggestion / Test
    // Even if Sentry isn't installed, we can simulate monitoring by spying on console.error
    // which is the current fallback in safe-action.
    it('should_log_error_when_service_throws_exception', async () => {
        // Arrange
        // Force database error by violating constraints or mocking internal failure if possible
        // Here we can rely on passing invalid data if schema validation allows it but DB rejects it,
        // OR mock the DB call if we want to test the wrapper purely.
        // Let's rely on a duplicate code constraint if one exists.

        // 'idx_materials_code_tenant_unique' exists.
        await createMaterial({ code: 'DUPLICATE', name: 'First', tenantId: testTeamId });

        // Spy on console.error to verify "monitoring" behavior
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        // Act
        // Create duplicate
        const result = await createMaterial({ code: 'DUPLICATE', name: 'Second', tenantId: testTeamId });

        // Assert
        expect(result.success).toBe(false);
        // Expect checking the error log mechanism (Sentry usually hooks here)
        expect(consoleSpy).toHaveBeenCalled();
        if (!result.success) {
            expect(result.error).toMatchObject({ message: 'Ошибка добавления' });
        }

        consoleSpy.mockRestore();
    });
});

/**
 * 🔍 SENTRY INTEGRATION SUGGESTION
 * 
 * To integrate Sentry:
 * 1. Initialize Sentry in `instrumentation.ts` or `sentry.client.config.ts`/`server`.
 * 2. Modify `lib/actions/safe-action.ts`:
 *    In the `catch` block, replace `console.error` with:
 *    `Sentry.captureException(e, { extra: { user: user?.id, action: actionName } });`
 * 3. Update the test `should_log_error_when_service_throws_exception` to mock 
 *    `Sentry.captureException` and assert it was called.
 */
