import { openai, supabase } from './config.js'
import { createEmbedding } from './services/embeddingService.js'

const query = "Fly me to the moon."
const embedding = await createEmbedding(query)
console.log(embedding)