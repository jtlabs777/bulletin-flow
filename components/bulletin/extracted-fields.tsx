'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FieldDefinition {
    id: string
    label: string
    type: string
    x: number
    y: number
    page: number
}

interface ExtractedFieldsProps {
    bulletinId: string
    hasTemplateFields: boolean
    currentFieldValues?: Record<string, string>
    templateFields?: FieldDefinition[]
}

export default function ExtractedFields({
    bulletinId,
    hasTemplateFields,
    currentFieldValues,
    templateFields,
}: ExtractedFieldsProps) {
    const [extracting, setExtracting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const hasExtractedValues =
        currentFieldValues && Object.keys(currentFieldValues).length > 0

    const handleExtract = async () => {
        setExtracting(true)
        setError(null)

        try {
            const response = await fetch(`/api/bulletins/${bulletinId}/extract`, {
                method: 'POST',
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to extract values')
            }

            // Refresh the page to show extracted values
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
                        {Object.entries(currentFieldValues!).map(([fieldId, value]) => (
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
