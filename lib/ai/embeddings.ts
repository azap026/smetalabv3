import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbedding(text: string): Promise<number[] | null> {
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
