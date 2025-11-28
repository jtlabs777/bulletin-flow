'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker
if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.mjs'
}

interface FieldDefinition {
    id: string
    label: string
    type: string
    x: number
    y: number
    page: number
    width?: number
    height?: number
}

interface ExtractedFieldsProps {
    bulletinId: string
    hasTemplateFields: boolean
    currentFieldValues?: Record<string, string>
    templateFields?: FieldDefinition[]
    pdfUrl: string
}

export default function ExtractedFields({
    bulletinId,
    hasTemplateFields,
    currentFieldValues,
    templateFields,
    pdfUrl,
}: ExtractedFieldsProps) {
    const [extracting, setExtracting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [extractedValues, setExtractedValues] = useState<Record<string, string> | null>(
        currentFieldValues || null
    )
    const router = useRouter()

    const hasExtractedValues = extractedValues && Object.keys(extractedValues).length > 0

    const extractFieldValues = async (): Promise<Record<string, string>> => {
        if (!templateFields || templateFields.length === 0) {
            throw new Error('No template fields defined')
        }

        // Load PDF document
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise
        const extracted: Record<string, string> = {}

        // Group fields by page
        const fieldsByPage: Record<number, FieldDefinition[]> = {}
        for (const field of templateFields) {
            const page = field.page || 1
            if (!fieldsByPage[page]) {
                fieldsByPage[page] = []
            }
            fieldsByPage[page].push(field)
        }

        // Process each page
        for (const [pageNum, pageFields] of Object.entries(fieldsByPage)) {
            const page = await pdf.getPage(parseInt(pageNum))
            const viewport = page.getViewport({ scale: 1.0 })
            const pageHeight = viewport.height
            const textContent = await page.getTextContent()

            // Extract text for each field on this page
            for (const field of pageFields) {
                // Convert Y coordinate from canvas (top-left) to PDF (bottom-left)
                const pdfY = pageHeight - field.y - (field.height || 15)

                const value = extractTextAtPosition(
                    textContent,
                    field.x,
                    pdfY,
                    field.width || 80,
                    field.height || 15,
                    pageHeight
                )
                extracted[field.id] = value
            }
        }

        return extracted
    }

    const extractTextAtPosition = (
        textContent: any,
        x: number,
        y: number,
        width: number,
        height: number,
        pageHeight?: number
    ): string => {
        const items = textContent.items as any[]
        const matchingItems: string[] = []

        for (const item of items) {
            const [, , , , itemX, itemY] = item.transform
            const itemWidth = item.width || 0
            const itemHeight = item.height || 10

            // Calculate the center point of the text item
            const itemCenterX = itemX + itemWidth / 2
            const itemCenterY = itemY + itemHeight / 2

            // Check if the CENTER of the text item falls within the field boundaries
            const centerInBounds =
                itemCenterX >= x &&
                itemCenterX <= x + width &&
                itemCenterY >= y &&
                itemCenterY <= y + height

            if (centerInBounds) {
                matchingItems.push(item.str)
            }
        }

        return matchingItems.join(' ').trim()
    }

    const handleExtract = async () => {
        setExtracting(true)
        setError(null)

        try {
            // Extract values client-side
            const values = await extractFieldValues()
            setExtractedValues(values)

            // Save to database via API
            const response = await fetch(`/api/bulletins/${bulletinId}/save-values`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fieldValues: values }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to save values')
            }

            // Refresh to show saved values
            router.refresh()
        } catch (err) {
            console.error('Extraction error:', err)
            setError(err instanceof Error ? err.message : 'Failed to extract values')
        } finally {
            setExtracting(false)
        }
    }

    const getFieldLabel = (fieldId: string): string => {
        const field = templateFields?.find((f) => f.id === fieldId)
        return field?.label || fieldId
    }

    if (!hasTemplateFields) {
        return null
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Field Values</CardTitle>
                <CardDescription>
                    {hasExtractedValues
                        ? 'Extracted values from this bulletin'
                        : 'Extract field values from the PDF'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!hasExtractedValues && (
                    <div>
                        <Button onClick={handleExtract} disabled={extracting}>
                            {extracting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Extracting...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Extract Field Values
                                </>
                            )}
                        </Button>
                        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                    </div>
                )}

                {hasExtractedValues && (
                    <div className="space-y-3">
                        {Object.entries(extractedValues!).map(([fieldId, value]) => (
                            <div
                                key={fieldId}
                                className="flex justify-between items-start p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-gray-700">
                                        {getFieldLabel(fieldId)}
                                    </p>
                                    <p className="text-base">{value || '(empty)'}</p>
                                </div>
                            </div>
                        ))}
                        <Button
                            onClick={handleExtract}
                            variant="outline"
                            size="sm"
                            disabled={extracting}
                        >
                            {extracting ? (
                                <>
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    Re-extracting...
                                </>
                            ) : (
                                'Re-extract Values'
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
