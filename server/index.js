import { openai, supabase } from './config.js'
import { createEmbedding } from './services/embeddingService.js'


async function main() {
    const query = 'I want to watch an action movie.'
    await semanticSearch(query)
}
main()


async function semanticSearch(input) {
    const embedding = await createEmbedding(input)
    console.log('Embedding successfully returned. Embedding: ', embedding)

    // https://supabase.com/docs/guides/ai/vector-columns
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding, // Pass the embedding you want to compare
      match_threshold: 0.1, // Choose an appropriate threshold for your data
      match_count: 3, // Choose the number of matches
    })
    
    if (error) console.error('Error: ', error)
    console.log('Search Result: ', data)
}