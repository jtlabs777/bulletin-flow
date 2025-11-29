'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, Loader2 } from 'lucide-react'
import { generateCustomPDF, downloadPDF } from '@/lib/pdf/generator'
import { FieldDefinition } from '@/lib/pdf/matcher'
import PDFPreviewModal from './pdf-preview-modal'

interface GeneratePDFButtonProps {
    bulletinId: string
    pdfUrl: string
    templateFields: FieldDefinition[]
    fieldValues: Record<string, string>
    bulletinTitle: string
}

export default function GeneratePDFButton({
    bulletinId,
    pdfUrl,
    templateFields,
    fieldValues,
    bulletinTitle
}: GeneratePDFButtonProps) {
    const [generating, setGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [previewPdfBytes, setPreviewPdfBytes] = useState<Uint8Array | null>(null)

    const handleGenerate = async () => {
        setGenerating(true)
        setError(null)

        try {
            // Generate the custom PDF
            const pdfBytes = await generateCustomPDF({
                templatePdfUrl: pdfUrl,
                fields: templateFields,
                fieldValues: fieldValues
            })

            // Show preview instead of auto-download
            setPreviewPdfBytes(pdfBytes)
        } catch (err) {
            console.error('PDF generation error:', err)
            setError(err instanceof Error ? err.message : 'Failed to generate PDF')
        } finally {
            setGenerating(false)
        }
    }

    const handleDownload = () => {
        if (previewPdfBytes) {
            // Create filename from bulletin title
            const filename = `${bulletinTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`

            // Download the PDF
            downloadPDF(previewPdfBytes, filename)
        }
    }

    const handleClosePreview = () => {
        setPreviewPdfBytes(null)
    }

    const hasValues = Object.keys(fieldValues).length > 0
    const hasFields = templateFields && templateFields.length > 0

    return (
        <>
            <div className="space-y-2">
                <Button
                    onClick={handleGenerate}
                    disabled={generating || !hasValues || !hasFields}
                    size="lg"
                    className="w-full sm:w-auto"
                >
                    {generating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating PDF...
                        </>
                    ) : (
                        <>
                            <Eye className="mr-2 h-4 w-4" />
                            Preview PDF
                        </>
                    )}
                </Button>

                {!hasFields && (
                    <p className="text-sm text-gray-500">
                        Template fields must be defined to generate PDF
                    </p>
                )}

                {hasFields && !hasValues && (
                    <p className="text-sm text-gray-500">
                        Extract field values before generating PDF
                    </p>
                )}

                {error && (
                    <p className="text-sm text-red-600">
                        {error}
                    </p>
                )}
            </div>

            <PDFPreviewModal
                pdfBytes={previewPdfBytes}
                filename={bulletinTitle}
                onClose={handleClosePreview}
                onDownload={handleDownload}
            />
        </>
    )
}
