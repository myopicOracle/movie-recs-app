import { openai, supabase } from './config.js'

async function main() {
    const testQuery = "A purple Elephant."
    const embedding = await createEmbedding(testQuery)
    await storeEmbedding(testQuery, embedding)

    console.log(embedding)
    console.log("Embedding stored!")
}

main()

// ===========================

async function createEmbedding(input) {
    const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: input,
        encoding_format: "float",
    });
    // console.log(embedding.data[0].embedding)   
    return embedding.data[0].embedding
}

async function storeEmbedding(originalText, embeddingText) {
    const dataObj = {
        content: originalText,
        embedding: embeddingText
    }
    await supabase.from('documents').insert(dataObj)
}