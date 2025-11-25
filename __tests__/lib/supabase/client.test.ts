import { describe, it, expect, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/client'

describe('Supabase Client', () => {
    beforeEach(() => {
        // Environment variables are set in __tests__/setup.ts
    })

    it('should create a client successfully with valid environment variables', () => {
        expect(() => createClient()).not.toThrow()
    })

    it('should throw an error if NEXT_PUBLIC_SUPABASE_URL is missing', () => {
        const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        delete process.env.NEXT_PUBLIC_SUPABASE_URL

        expect(() => createClient()).toThrow('Missing Supabase environment variables')

        process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
    })

    it('should throw an error if NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
        const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        expect(() => createClient()).toThrow('Missing Supabase environment variables')

        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
    })

    it('should return a client instance with required methods', () => {
        const client = createClient()

        expect(client).toBeDefined()
        expect(client.auth).toBeDefined()
        expect(client.from).toBeDefined()
        expect(client.storage).toBeDefined()
    })
})
