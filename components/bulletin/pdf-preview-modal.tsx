'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface PDFPreviewModalProps {
    pdfBytes: Uint8Array | null
    filename: string
    onClose: () => void
    onDownload: () => void
}

export default function PDFPreviewModal({
    pdfBytes,
    filename,
    onClose,
    onDownload
}: PDFPreviewModalProps) {
    const [pdfUrl, setPdfUrl] = useState<string>('')

    useEffect(() => {
        if (pdfBytes) {
            // Create blob URL for PDF preview
            const blob = new Blob([pdfBytes], { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)
            setPdfUrl(url)

            // Cleanup on unmount
            return () => URL.revokeObjectURL(url)
        }
    }, [pdfBytes])

    if (!pdfBytes) return null

    return (
        <Dialog open={!!pdfBytes} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>PDF Preview</DialogTitle>
                    <DialogDescription>
                        Review your generated bulletin before downloading
                    </DialogDescription>
                </DialogHeader>

                {/* PDF Preview */}
                <div className="flex-1 relative bg-gray-100 rounded-lg overflow-hidden">
                    {pdfUrl && (
                        <iframe
                            src={pdfUrl}
                            className="w-full h-full border-0"
                            title="PDF Preview"
                        />
                    )}
                </div>

                <DialogFooter className="flex justify-between sm:justify-between">
                    <Button
                        variant="outline"
                        onClick={onClose}
                    >
                        <X className="mr-2 h-4 w-4" />
                        Close
                    </Button>
                    <Button
                        onClick={() => {
                            onDownload()
                            onClose()
                        }}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
