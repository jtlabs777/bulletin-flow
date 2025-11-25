import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadPdfToStorage, createBulletinRecord, getUserChurch } from '@/lib/pdf/upload'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const weekOf = formData.get('weekOf') as string

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        if (!weekOf) {
            return NextResponse.json({ error: 'Week date is required' }, { status: 400 })
        }

        // Get user's church
        const church = await getUserChurch()

        // Upload PDF to storage
        const pdfUrl = await uploadPdfToStorage(church.id, file)

        // Create bulletin record
        const bulletinId = await createBulletinRecord(church.id, pdfUrl, new Date(weekOf))

        return NextResponse.json({ bulletinId, pdfUrl })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Upload failed' },
            { status: 500 }
        )
    }
}
