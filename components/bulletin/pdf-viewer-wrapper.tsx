'use client'

import dynamic from 'next/dynamic'

// Import PdfViewer dynamically to avoid SSR issues with pdf.js
const PdfViewer = dynamic(() => import('@/components/bulletin/pdf-viewer'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center p-8 text-gray-600">Loading PDF viewer...</div>
})

interface PdfViewerWrapperProps {
    pdfUrl: string
}

export default function PdfViewerWrapper({ pdfUrl }: PdfViewerWrapperProps) {
    return <PdfViewer pdfUrl={pdfUrl} />
}
