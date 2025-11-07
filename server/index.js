import { openai, supabase } from './config.js'


async function main() {
    await createEmbedding("A purple Elephant")
}
main()


async function createEmbedding(input) {
    const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: input,
        encoding_format: "float",
    });
    console.log(embedding)
    console.log(embedding.data[0].embedding)
}