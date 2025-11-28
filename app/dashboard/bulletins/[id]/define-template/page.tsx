import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DefineTemplateClient from '@/components/bulletin/define-template-client'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function DefineTemplatePage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    // Get user
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get user's church
    const { data: church } = await supabase
        .from('churches')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()

    if (!church) {
        redirect('/dashboard/create-church')
    }

    // Get bulletin
    const { data: bulletin, error } = await supabase
        .from('bulletins')
        .select('*')
        .eq('id', id)
        .eq('church_id', church.id)
        .single()

    if (error || !bulletin) {
        redirect('/dashboard')
    }

    return (
        <DefineTemplateClient
            bulletinId={id}
            pdfUrl={bulletin.original_pdf_url}
            existingFields={bulletin.template_fields || []}
            templateName={bulletin.template_name || ''}
            fieldValues={bulletin.field_values || {}}
        />
    )
}
