import { openai, supabase } from './config.js'
import { createEmbedding } from './services/embeddingService.js'

const systemMessage = [{
  role: 'system',
  content: 'You are a helpful assistant who enjoys recommending movies to users. You will be given two pieces of information - some context about the movie and a question. Your task is to formulate an answer to the question based on the provided context. Use a friendly and conversational tone.'
}]

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    
    // CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    }

    if (url.pathname === '/' && request.method === 'GET') {
      return new Response('You\'ve found my Movie Recommendations API! Nothing to see here - POST requests go to the /chat endpoint', {
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    if (url.pathname === '/chat' && request.method === 'POST') {
      try {

        const { message } = await request.json()
        console.log('Received message:', message)

        const matchedResult = await semanticSearch(message, env)
        console.log('Semantic search result:', matchedResult)

        const assistantResponse = await conversationalResponse(matchedResult, message, env)
        console.log('Assistant response:', assistantResponse)
        
        return new Response(JSON.stringify({ response: assistantResponse }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        })
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: error.message,
          stack: error.stack
         }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }
    }

    return new Response('Not Found', { status: 404 })
  },
}

async function semanticSearch(input, env) {
    const embedding = await createEmbedding(input, env)
    console.log('Embedding successfully returned. Embedding: ', embedding)

    // https://supabase.com/docs/guides/ai/vector-columns
    const { data, error } = await supabase(env).rpc('match_documents', {
      query_embedding: embedding, // Pass the embedding you want to compare
      match_threshold: 0.1, // Choose an appropriate threshold for your data
      match_count: 1, // Choose the number of matches
    })
    
    if (error) console.error('Error: ', error)
    // console.log('Returned Obj: ', data)
    // console.log('Returned Content - type: ', `<${typeof data[0].content}> `, data[0].content)

    return data[0].content
}

async function conversationalResponse(context, question, env) {
  const chatMessages = [
  systemMessage, 
  {
    role: 'user',
    content: `Context: ${context} --- Question: ${question}`
  }]
  // console.log('Appended user query to chat history: ', chatMessages)

  const response = await openai(env).chat.completions.create({
    model: 'gpt-4.1-nano',
    messages: chatMessages,
    temperature: 0.5,
    frequency_penalty: 0.5
  })
  // console.log('Response object: ', response)

  return response.choices[0].message.content
}
