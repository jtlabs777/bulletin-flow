import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createTemplate } from '@/lib/pdf/matcher'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()
        const { name, fieldDefinitions, fingerprint } = body

        if (!name || !fieldDefinitions || !fingerprint) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Get user
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        // Get user's church
        const { data: church } = await supabase
            .from('churches')
            .select('id')
            .eq('owner_id', user.id)
            .single()

        if (!church) {
            return NextResponse.json({ error: 'No church found' }, { status: 404 })
        }

        // Verify bulletin belongs to user's church
        const { data: bulletin } = await supabase
            .from('bulletins')
            .select('id')
            .eq('id', id)
            .eq('church_id', church.id)
            .single()

        if (!bulletin) {
            return NextResponse.json({ error: 'Bulletin not found' }, { status: 404 })
        }

        // Create template
        const templateId = await createTemplate(
            id,
            name,
            fieldDefinitions,
            fingerprint,
            church.id
        )

        return NextResponse.json({ templateId, success: true })
    } catch (error) {
        console.error('Create template error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create template' },
            { status: 500 }
        )
    }
}
