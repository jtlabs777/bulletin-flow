import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for browser-side use
 * Uses environment variables for configuration
 */
export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables')
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
