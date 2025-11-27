'use client'

import { useState, useEffect } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

interface PdfViewerProps {
    pdfUrl: string
    onPageClick?: (x: number, y: number, page: number) => void
    showControls?: boolean
}

export default function PdfViewer({
    pdfUrl,
    onPageClick,
    showControls = true
}: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number>(0)
    const [pageNumber, setPageNumber] = useState<number>(1)
    const [scale, setScale] = useState<number>(1.0)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>('')

    useEffect(() => {
        loadPdf()
    }, [pdfUrl, pageNumber, scale])

    const loadPdf = async () => {
        try {
            setLoading(true)
            setError('')

            // Load PDF
            const loadingTask = pdfjsLib.getDocument(pdfUrl)
            const pdf = await loadingTask.promise

            setNumPages(pdf.numPages)

            // Get page
            const page = await pdf.getPage(pageNumber)

            // Prepare canvas
            const canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement
            if (!canvas) return

            const context = canvas.getContext('2d')
            if (!context) return

            // Set viewport
            const viewport = page.getViewport({ scale })
            canvas.height = viewport.height
            canvas.width = viewport.width

            // Render PDF page
            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            }

            await page.render(renderContext).promise
            setLoading(false)
        } catch (err) {
            console.error('Error loading PDF:', err)
            setError('Failed to load PDF')
            setLoading(false)
        }
    }

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!onPageClick) return

        const canvas = e.currentTarget
        const rect = canvas.getBoundingClientRect()

        // Calculate click position relative to PDF coordinates
        const x = (e.clientX - rect.left) / scale
        const y = (e.clientY - rect.top) / scale

        onPageClick(x, y, pageNumber)
    }

    const changePage = (delta: number) => {
        const newPage = pageNumber + delta
        if (newPage >= 1 && newPage <= numPages) {
            setPageNumber(newPage)
        }
    }

    const changeZoom = (delta: number) => {
        const newScale = scale + delta
        if (newScale >= 0.5 && newScale <= 3.0) {
            setScale(newScale)
        }
    }

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Controls */}
            {showControls && (
                <div className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg">
                    {/* Page controls */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => changePage(-1)}
                            disabled={pageNumber <= 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">
                            Page {pageNumber} of {numPages}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => changePage(1)}
                            disabled={pageNumber >= numPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Zoom controls */}
                    <div className="flex items-center gap-2 border-l pl-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => changeZoom(-0.1)}
                            disabled={scale <= 0.5}
                        >
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">
                            {Math.round(scale * 100)}%
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => changeZoom(0.1)}
                            disabled={scale >= 3.0}
                        >
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* PDF Canvas */}
            <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <div className="text-gray-600">Loading PDF...</div>
                    </div>
                )}
                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                        <div className="text-red-600">{error}</div>
                    </div>
                )}
                <canvas
                    id="pdf-canvas"
                    onClick={handleCanvasClick}
                    className={onPageClick ? 'cursor-crosshair' : 'cursor-default'}
                />
            </div>

            {onPageClick && (
                <p className="text-sm text-gray-600">
                    Click on the PDF to define field positions
                </p>
            )}
        </div>
    )
}
