import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase environment variables. Please define NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.'
  )
}

// Standard client: Use this for basic queries
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client: Use this ONLY in 'use server' files (like actions.ts)
// This key allows us to write to the DB even with RLS enabled
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)