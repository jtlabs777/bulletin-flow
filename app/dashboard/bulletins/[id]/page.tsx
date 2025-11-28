import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Edit, FileText, Download } from 'lucide-react'
import PdfViewerWrapper from '@/components/bulletin/pdf-viewer-wrapper'
import ExtractedFields from '@/components/bulletin/extracted-fields'
import GeneratePDFButton from '@/components/bulletin/generate-pdf-button'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ViewBulletinPage({ params }: PageProps) {
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
        .select(`
      *,
      template:templates(*)
    `)
        .eq('id', id)
        .eq('church_id', church.id)
        .single()

    if (error || !bulletin) {
        redirect('/dashboard')
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Bulletin Details</h1>
                        <p className="text-gray-600 mt-1">
                            Week of {new Date(bulletin.week_of).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <a href={bulletin.original_pdf_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                    </a>
                </div>
            </div>

            {/* Metadata Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-lg">
                                {bulletin.is_template ? 'Template' : 'Bulletin'}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Template</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {bulletin.template ? (
                            <Link href={`/dashboard/templates/${bulletin.template.id}`}>
                                <Button variant="link" className="p-0 h-auto">
                                    {bulletin.template.name}
                                </Button>
                            </Link>
                        ) : (
                            <span className="text-gray-500">No template assigned</span>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Created</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-lg">
                            {new Date(bulletin.created_at).toLocaleDateString()}
                        </span>
                    </CardContent>
                </Card>
            </div>

            {/* Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Actions</CardTitle>
                    <CardDescription>
                        What would you like to do with this bulletin?
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                    {!bulletin.is_template && (
                        <Link href={`/dashboard/bulletins/${id}/define-template`}>
                            <Button>
                                <Edit className="mr-2 h-4 w-4" />
                                Define as Template
                            </Button>
                        </Link>
                    )}
                    {bulletin.template_id && (
                        <Link href={`/dashboard/bulletins/${id}/edit-values`}>
                            <Button variant="outline">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Field Values
                            </Button>
                        </Link>
                    )}
                    {bulletin.is_template && (
                        <Link href={`/dashboard/bulletins/${id}/define-template`}>
                            <Button variant="outline">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Template Fields
                            </Button>
                        </Link>
                    )}
                </CardContent>
            </Card>

            {/* Extracted Field Values */}
            <ExtractedFields
                bulletinId={id}
                hasTemplateFields={
                    !!bulletin.template_fields ||
                    (bulletin.is_template && !!bulletin.template_fields)
                }
                currentFieldValues={bulletin.field_values as Record<string, string> | undefined}
                templateFields={bulletin.template_fields as any}
                pdfUrl={bulletin.original_pdf_url}
            />

            {/* Generate PDF */}
            {bulletin.template_fields && bulletin.field_values && (
                <Card>
                    <CardHeader>
                        <CardTitle>Generate Custom PDF</CardTitle>
                        <CardDescription>
                            Download a bulletin with your customized field values
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <GeneratePDFButton
                            bulletinId={id}
                            pdfUrl={bulletin.original_pdf_url}
                            templateFields={bulletin.template_fields as any}
                            fieldValues={bulletin.field_values as Record<string, string>}
                            bulletinTitle={bulletin.week_of || `bulletin_${id}`}
                        />
                    </CardContent>
                </Card>
            )}

            {/* PDF Preview */}
            <Card>
                <CardHeader>
                    <CardTitle>PDF Preview</CardTitle>
                </CardHeader>
                <CardContent>
                    <PdfViewerWrapper pdfUrl={bulletin.original_pdf_url} />
                </CardContent>
            </Card>
        </div>
    )
}
