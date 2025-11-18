import OpenAI from "openai/index.js";
import { createClient } from '@supabase/supabase-js'

export const openai = (env) => {
  if (!env.OPENAI_API_KEY) throw new Error('OpenAI API key is missing or invalid.')
  return new OpenAI({
    apiKey: env.OPENAI_API_KEY
  })
}

export const supabase = (env) => {
  if (!env.SUPABASE_URL) throw new Error('SUPABASE_URL is missing or invalid.')
  if (!env.SUPABASE_API_KEY) throw new Error('SUPABASE_API_KEY is missing or invalid.')
  return createClient(env.SUPABASE_URL, env.SUPABASE_API_KEY)
}