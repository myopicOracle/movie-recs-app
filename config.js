import 'dotenv/config'
import OpenAI from "openai";
import { createClient } from '@supabase/supabase-js'

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const supabaseUrl = 'https://ynaholibienybgjtnzcu.supabase.co'
const supabaseKey = process.env.SUPABASE_API_KEY
export const supabase = createClient(supabaseUrl, supabaseKey)