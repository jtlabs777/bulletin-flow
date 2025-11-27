'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { extractTextWithPositions } from '@/lib/pdf/analyzer'
import { FieldDefinition } from '@/lib/pdf/matcher'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import PdfViewer from '@/components/bulletin/pdf-viewer'
import FieldMarker from '@/components/bulletin/field-marker'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { v4 as uuidv4 } from 'uuid'

interface DefineTemplateClientProps {
    bulletinId: string
    pdfUrl: string
    existingFields?: FieldDefinition[]
    templateName?: string
}

export default function DefineTemplateClient({
    bulletinId,
    pdfUrl,
    existingFields = [],
    templateName: initialName = ''
}: DefineTemplateClientProps) {
    const router = useRouter()
    const [fields, setFields] = useState<FieldDefinition[]>(existingFields)
    const [templateName, setTemplateName] = useState(initialName)
    const [showFieldDialog, setShowFieldDialog] = useState(false)
    const [currentPosition, setCurrentPosition] = useState<{ x: number, y: number, page: number } | null>(null)
    const [newFieldLabel, setNewFieldLabel] = useState('')
    const [newFieldType, setNewFieldType] = useState<'text' | 'date' | 'number'>('text')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const handlePdfClick = (x: number, y: number, page: number) => {
        setCurrentPosition({ x, y, page })
        setNewFieldLabel('')
        setNewFieldType('text')
        setShowFieldDialog(true)
    }

    const handleAddField = () => {
        if (!currentPosition || !newFieldLabel.trim()) {
            setError('Field label is required')
            return
        }

        const newField: FieldDefinition = {
            id: uuidv4(),
            label: newFieldLabel.trim(),
            x: currentPosition.x,
            y: currentPosition.y,
            width: 100, // Default width
            height: 20, // Default height
            page: currentPosition.page,
            type: newFieldType
        }

        setFields([...fields, newField])
        setShowFieldDialog(false)
        setError('')
    }

    const handleDeleteField = (fieldId: string) => {
        setFields(fields.filter(f => f.id !== fieldId))
    }

    const handleSaveTemplate = async () => {
        if (!templateName.trim()) {
            setError('Template name is required')
            return
        }

        if (fields.length === 0) {
            setError('At least one field is required')
            return
        }

        setSaving(true)
        setError('')

        try {
            // Analyze PDF to get fingerprint
            const metadata = await extractTextWithPositions(pdfUrl)

            // Save template
            const response = await fetch(`/api/bulletins/${bulletinId}/create-template`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: templateName,
                    fieldDefinitions: fields,
                    fingerprint: metadata.fingerprint
                })
            })

            if (!response.ok) {
                throw new Error('Failed to save template')
            }

            // Redirect back to bulletin view
            router.push(`/dashboard/bulletins/${bulletinId}`)
            router.refresh()
        } catch (err) {
            console.error('Save template error:', err)
            setError(err instanceof Error ? err.message : 'Failed to save template')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/bulletins/${bulletinId}`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Define Template</h1>
                        <p className="text-gray-600 mt-1">
                            Click on the PDF to define field positions
                        </p>
                    </div>
                </div>
                <Button onClick={handleSaveTemplate} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Template'}
                </Button>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* Template Name */}
            <Card>
                <CardHeader>
                    <CardTitle>Template Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="templateName">Template Name</Label>
                        <Input
                            id="templateName"
                            placeholder="e.g., Sunday Bulletin Template"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Fields List */}
            <Card>
                <CardHeader>
                    <CardTitle>Defined Fields ({fields.length})</CardTitle>
                    <CardDescription>
                        Fields you've marked on the PDF
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {fields.length === 0 ? (
                        <p className="text-gray-500 text-sm">
                            No fields defined yet. Click on the PDF below to add fields.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {fields.map((field) => (
                                <div
                                    key={field.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium">{field.label}</p>
                                        <p className="text-sm text-gray-600">
                                            Page {field.page} • Type: {field.type} • Position: ({Math.round(field.x)}, {Math.round(field.y)})
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteField(field.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* PDF with Field Markers */}
            <Card>
                <CardHeader>
                    <CardTitle>PDF Template</CardTitle>
                    <CardDescription>
                        Click to add field markers
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <PdfViewer pdfUrl={pdfUrl} onPageClick={handlePdfClick} />
                        {/* This is where field markers would be overlaid */}
                    </div>
                </CardContent>
            </Card>

            {/* Field Definition Dialog */}
            <Dialog open={showFieldDialog} onOpenChange={setShowFieldDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Define Field</DialogTitle>
                        <DialogDescription>
                            Add a field at position ({currentPosition?.x.toFixed(0)}, {currentPosition?.y.toFixed(0)})
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="fieldLabel">Field Label</Label>
                            <Input
                                id="fieldLabel"
                                placeholder="e.g., Speaker Name"
                                value={newFieldLabel}
                                onChange={(e) => setNewFieldLabel(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fieldType">Field Type</Label>
                            <Select value={newFieldType} onValueChange={(value: any) => setNewFieldType(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowFieldDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddField}>Add Field</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
