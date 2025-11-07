import 'dotenv/config'
import OpenAI from "openai";
import { createClient } from '@supabase/supabase-js'

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_API_KEY
export const supabase = createClient(supabaseUrl, supabaseKey)