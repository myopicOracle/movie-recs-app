import 'dotenv/config'
import OpenAI from "openai/index.js";
import { createClient } from '@supabase/supabase-js'

if (!process.env.OPENAI_API_KEY) throw new Error('OpenAI API key is missing or invalid.')
export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

if (!process.env.SUPABASE_URL) throw new Erorr('SUPABASE_URL is missing or invalid.')
const supabaseUrl = process.env.SUPABASE_URL
if (!process.env.SUPABASE_API_KEY) throw new Erorr('SUPABASE_API_KEY is missing or invalid.')
const supabaseKey = process.env.SUPABASE_API_KEY
export const supabase = createClient(supabaseUrl, supabaseKey)