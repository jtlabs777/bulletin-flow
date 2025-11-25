'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export default function UploadZone() {
    const router = useRouter()
    const [file, setFile] = useState<File | null>(null)
    const [weekOf, setWeekOf] = useState('')
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'application/pdf': ['.pdf'],
        },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024, // 10MB
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                setFile(acceptedFiles[0])
                setError('')
            }
        },
        onDropRejected: (fileRejections) => {
            if (fileRejections[0]?.errors[0]?.code === 'file-too-large') {
                setError('File is too large. Maximum size is 10MB.')
            } else if (fileRejections[0]?.errors[0]?.code === 'file-invalid-type') {
                setError('Invalid file type. Only PDF files are allowed.')
            }
        },
    })

    const handleUpload = async () => {
        if (!file || !weekOf) {
            setError('Please select a PDF file and specify a date')
            return
        }

        setUploading(true)
        setError('')

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('weekOf', weekOf)

            const response = await fetch('/api/bulletins/upload', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Upload failed')
            }

            const { bulletinId } = await response.json()
            router.push(`/dashboard/bulletins/${bulletinId}/define-template`)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="pt-6">
                    <div
                        {...getRootProps()}
                        className={cn(
                            'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
                            isDragActive
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:border-gray-400'
                        )}
                    >
                        <input {...getInputProps()} />
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        {isDragActive ? (
                            <p className="text-lg text-blue-600">Drop the PDF here...</p>
                        ) : (
                            <div>
                                <p className="text-lg text-gray-700 mb-2">
                                    Drag and drop your bulletin PDF here
                                </p>
                                <p className="text-sm text-gray-500">
                                    or click to browse (max 10MB)
                                </p>
                            </div>
                        )}
                    </div>

                    {file && (
                        <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <FileText className="h-8 w-8 text-blue-600" />
                                <div>
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-sm text-gray-600">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setFile(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="weekOf">Week Of</Label>
                        <Input
                            id="weekOf"
                            type="date"
                            value={weekOf}
                            onChange={(e) => setWeekOf(e.target.value)}
                            required
                        />
                        <p className="text-sm text-gray-600">
                            Select the Sunday date for this bulletin
                        </p>
                    </div>

                    <Button
                        onClick={handleUpload}
                        disabled={!file || !weekOf || uploading}
                        className="w-full"
                    >
                        {uploading ? 'Uploading...' : 'Upload and Continue'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
