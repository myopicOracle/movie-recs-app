import { openai, supabase } from './config.js'
import movies from './movies.js'

// ===========================
main()

async function main() {
    await createAndStoreEmbedding(movies)    
}

async function createAndStoreEmbedding(inputArray) {
    
    const data = await Promise.all(

        inputArray.map( async (item) => {

            const embedding = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: item.content,
            encoding_format: "float",
            });

            return {
                // title: item.title,
                // release_year: item.release_year,
                // content: item.content,
                ...item, // replace with spread operator
                embedding: embedding.data[0].embedding
            }

        })
    )
    // console.log(data)

    try {
        const { error } =  await supabase.from('documents').insert(data)
        if (error) throw error
        console.log("Embedding stored!")
    } catch (error) {
        console.error("Insert failed:", error)
    }
}
