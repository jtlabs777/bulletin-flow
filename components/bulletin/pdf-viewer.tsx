'use client'

import { useState, useEffect, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

//@ts-ignore
// Configure PDF.js worker - use local worker file
if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.mjs'
}

interface PdfViewerProps {
    pdfUrl: string
    onPageClick?: (x: number, y: number, page: number) => void
    onMouseDown?: (x: number, y: number, page: number) => void
    onMouseMove?: (x: number, y: number, page: number) => void
    onMouseUp?: (x: number, y: number, page: number) => void
    dragStart?: { x: number; y: number } | null
    dragCurrent?: { x: number; y: number } | null
    showControls?: boolean
}

export default function PdfViewer({
    pdfUrl,
    onPageClick,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    dragStart,
    dragCurrent,
    showControls = true
}: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number>(0)
    const [pageNumber, setPageNumber] = useState<number>(1)
    const [scale, setScale] = useState<number>(1.0)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>('')
    // Key to force canvas recreation (fixes React Strict Mode double-render)
    const [canvasKey, setCanvasKey] = useState<number>(0)

    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        // Force canvas recreation to avoid PDF.js canvas conflicts
        setCanvasKey(prev => prev + 1)

        // Small delay to ensure canvas is ready
        const timer = setTimeout(() => {
            loadPdf()
        }, 50)

        return () => {
            clearTimeout(timer)
        }
    }, [pdfUrl, pageNumber, scale])

    const loadPdf = async () => {
        try {
            setLoading(true)
            setError('')

            // Load PDF
            const pdf = await pdfjsLib.getDocument(pdfUrl).promise

            setNumPages(pdf.numPages)

            // Get page
            const page = await pdf.getPage(pageNumber)

            // Prepare canvas
            const canvas = canvasRef.current
            if (!canvas) {
                return
            }

            const context = canvas.getContext('2d')
            if (!context) {
                return
            }

            // Set viewport
            const viewport = page.getViewport({ scale })
            canvas.height = viewport.height
            canvas.width = viewport.width

            // Render PDF page
            await page.render({
                canvasContext: context,
                viewport: viewport,
            } as any).promise

            setLoading(false)
        } catch (err: any) {
            console.error('Error loading PDF:', err)
            setError('Failed to load PDF')
            setLoading(false)
        }
    }

    const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = e.currentTarget
        const rect = canvas.getBoundingClientRect()
        const x = (e.clientX - rect.left) / scale
        const y = (e.clientY - rect.top) / scale
        return { x, y }
    }

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!onPageClick) return
        const { x, y } = getCoordinates(e)
        onPageClick(x, y, pageNumber)
    }

    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!onMouseDown) return
        const { x, y } = getCoordinates(e)
        onMouseDown(x, y, pageNumber)
    }

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!onMouseMove) return
        const { x, y } = getCoordinates(e)
        onMouseMove(x, y, pageNumber)
    }

    const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!onMouseUp) return
        const { x, y } = getCoordinates(e)
        onMouseUp(x, y, pageNumber)
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
                    key={canvasKey}
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    className={onMouseDown || onPageClick ? 'cursor-crosshair' : 'cursor-default'}
                />

                {/* Selection rectangle overlay */}
                {dragStart && dragCurrent && (
                    <div
                        className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-30 pointer-events-none"
                        style={{
                            left: `${Math.min(dragStart.x, dragCurrent.x) * scale}px`,
                            top: `${Math.min(dragStart.y, dragCurrent.y) * scale}px`,
                            width: `${Math.abs(dragCurrent.x - dragStart.x) * scale}px`,
                            height: `${Math.abs(dragCurrent.y - dragStart.y) * scale}px`,
                        }}
                    />
                )}
            </div>

            {(onMouseDown || onPageClick) && (
                <p className="text-sm text-gray-600">
                    {onMouseDown ? 'Drag to select field area' : 'Click on the PDF to define field positions'}
                </p>
            )}
        </div>
    )
}
