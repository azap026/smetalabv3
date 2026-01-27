
import { db, client } from '@/lib/db/drizzle';
import { materials } from '@/lib/db/schema';
import { generateEmbeddingsBatch } from '@/lib/ai/embeddings';
import { eq, isNull, and, sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
    console.log('🚀 Starting offline embedding generation...');

    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ CRITICAL: OPENAI_API_KEY is not defined in environment variables. Exiting.');
        process.exit(1);
    }

    // 1. Get user/team context (Optional: or just process ALL missing embeddings globally?)
    // For safety, let's process ALL missing embeddings in the DB since this is an admin script.

    const BATCH_SIZE = 50; // Larger batch size for local script
    let totalProcessed = 0;
    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 3;

    while (true) {
        // Fetch batch
        const batch = await db
            .select()
            .from(materials)
            .where(isNull(materials.embedding))
            .limit(BATCH_SIZE);

        if (batch.length === 0) {
            console.log('✅ No more items to process.');
            break;
        }

        console.log(`📦 Processing batch of ${batch.length} items...`);

        // Prepare texts
        const texts = batch.map(m => {
            return `Материал: ${m.name}. Код: ${m.code}. Поставщик: ${m.vendor || '—'}. Категории: ${[m.categoryLv1, m.categoryLv2, m.categoryLv3, m.categoryLv4].filter(Boolean).join(' > ') || '—'}. Ед.изм: ${m.unit || '—'}. ${m.description || ''}`;
        });

        // Generate embeddings
        const embeddings = await generateEmbeddingsBatch(texts);

        if (!embeddings || embeddings.length !== batch.length) {
            consecutiveErrors++;
            console.error(`❌ Error generating embeddings for batch (Attempt ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}). Retrying in 5s...`);

            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                console.error('❌ Too many consecutive errors. Aborting script.');
                process.exit(1);
            }

            await new Promise(r => setTimeout(r, 5000));
            continue;
        }

        // Reset error counter on success
        consecutiveErrors = 0;

        // Update DB (Parallel is fine here as script is single-thread dominant and we want speed, 
        // but sequential is safer for connection pool. Let's do Promise.all with some concurrency control if needed, 
        // or just sequential since we have time).
        // Let's us sequential to be super safe against "CONNECTION_CLOSED".

        for (let i = 0; i < batch.length; i++) {
            await db.update(materials)
                .set({ embedding: embeddings[i], updatedAt: new Date() })
                .where(eq(materials.id, batch[i].id));
        }

        totalProcessed += batch.length;
        console.log(`✨ Processed ${totalProcessed} items so far.`);

        // Small delay to be nice to API limits
        await new Promise(r => setTimeout(r, 500));
    }

    console.log('🎉 Done! All materials processed.');
    process.exit(0);
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
