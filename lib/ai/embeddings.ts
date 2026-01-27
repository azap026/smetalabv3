import OpenAI from 'openai';

export async function generateEmbedding(text: string): Promise<number[] | null> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.error('CRITICAL: OPENAI_API_KEY is not defined in environment variables!');
        return null;
    }

    const openai = new OpenAI({ apiKey });

    if (!text) return null;
    // Clean newlines
    const cleanGeneric = text.replace(/\n/g, ' ');

    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: cleanGeneric,
        });

        return response.data[0].embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        return null; // Fail gracefully
    }
}

export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][] | null> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.error('CRITICAL: OPENAI_API_KEY is not defined in environment variables!');
        return null;
    }

    const openai = new OpenAI({ apiKey });

    if (!texts || texts.length === 0) return [];

    // Clean newlines
    const cleanTexts = texts.map(t => t.replace(/\n/g, ' '));

    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: cleanTexts,
        });

        return response.data.map(d => d.embedding);
    } catch (error) {
        console.error('Error generating batch embeddings:', error);
        return null;
    }
}
