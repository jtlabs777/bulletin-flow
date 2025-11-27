import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractFieldValues, type FieldDefinition } from '@/lib/pdf/extractor'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
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

        // Get bulletin and verify ownership
        const { data: bulletin, error: bulletinError } = await supabase
            .from('bulletins')
            .select('*')
            .eq('id', id)
            .eq('church_id', church.id)
            .single()

        if (bulletinError || !bulletin) {
            return NextResponse.json({ error: 'Bulletin not found' }, { status: 404 })
        }

        // Check if bulletin has a template OR is itself a template
        let templateFields: FieldDefinition[] | null = null

        if (bulletin.is_template && bulletin.template_fields) {
            // This bulletin IS a template, use its own fields
            templateFields = bulletin.template_fields as FieldDefinition[]
        } else if (bulletin.template_id) {
            // Get template fields from linked template
            const { data: template } = await supabase
                .from('bulletins')
                .select('template_fields')
                .eq('id', bulletin.template_id)
                .eq('is_template', true)
                .single()

            if (template?.template_fields) {
                templateFields = template.template_fields as FieldDefinition[]
            }
        }

        if (!templateFields || templateFields.length === 0) {
            return NextResponse.json(
                { error: 'No template fields found for this bulletin' },
                { status: 400 }
            )
        }

        // Extract values from PDF
        const extractedValues = await extractFieldValues(
            bulletin.original_pdf_url,
            templateFields
        )

        // Save extracted values to database
        const { error: updateError } = await supabase
            .from('bulletins')
            .update({ field_values: extractedValues })
            .eq('id', id)

        if (updateError) {
            console.error('Error saving extracted values:', updateError)
            throw updateError
        }

        return NextResponse.json({
            success: true,
            extractedValues,
        })
    } catch (error) {
        console.error('Field extraction error:', error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to extract field values',
            },
            { status: 500 }
        )
    }
}
