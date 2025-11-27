import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()
        const { fieldValues } = body

        if (!fieldValues) {
            return NextResponse.json({ error: 'Missing field values' }, { status: 400 })
        }

        const supabase = await createClient()

        // Get user and verify authentication
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

        // Save extracted values to database
        const { error: updateError } = await supabase
            .from('bulletins')
            .update({ field_values: fieldValues })
            .eq('id', id)
            .eq('church_id', church.id)

        if (updateError) {
            console.error('Error saving field values:', updateError)
            throw updateError
        }

        return NextResponse.json({
            success: true,
        })
    } catch (error) {
        console.error('Save values error:', error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to save field values',
            },
            { status: 500 }
        )
    }
}
