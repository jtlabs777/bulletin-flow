import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

/**
 * Upload a PDF file to Supabase Storage
 */
export async function uploadPdfToStorage(
    churchId: string,
    file: File
): Promise<string> {
    const supabase = await createClient()

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${churchId}/${uuidv4()}.${fileExt}`

    // Upload to storage
    const { data, error } = await supabase.storage
        .from('bulletin-pdfs')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
        })

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('bulletin-pdfs')
        .getPublicUrl(data.path)

    return publicUrl
}

/**
 * Create a bulletin record in the database
 */
export async function createBulletinRecord(
    churchId: string,
    pdfUrl: string,
    weekOf: Date
): Promise<string> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('bulletins')
        .insert({
            church_id: churchId,
            original_pdf_url: pdfUrl,
            week_of: weekOf.toISOString().split('T')[0],
        })
        .select('id')
        .single()

    if (error) throw error

    return data.id
}

/**
 * Get user's church
 */
export async function getUserChurch() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { data: church, error } = await supabase
        .from('churches')
        .select('*')
        .eq('owner_id', user.id)
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            throw new Error('No church found for your account. Please contact support or create a church from your profile.')
        }
        throw error
    }

    return church
}
