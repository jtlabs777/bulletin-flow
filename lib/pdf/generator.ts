// PDF Generator - Overlay field values onto template PDF
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { FieldDefinition } from './matcher'

export interface GeneratePDFOptions {
    templatePdfUrl: string
    fields: FieldDefinition[]
    fieldValues: Record<string, string>
    fontSize?: number
}

/**
 * Generate a custom PDF by overlaying field values onto a template PDF
 * @param options - Configuration for PDF generation
 * @returns PDF as Uint8Array ready for download
 */
export async function generateCustomPDF(options: GeneratePDFOptions): Promise<Uint8Array> {
    const { templatePdfUrl, fields, fieldValues, fontSize = 12 } = options

    try {
        // Fetch the template PDF
        const templateBytes = await fetch(templatePdfUrl).then(res => res.arrayBuffer())

        // Load the PDF document
        const pdfDoc = await PDFDocument.load(templateBytes)

        // Embed a standard font
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

        // Process each field
        for (const field of fields) {
            const value = fieldValues[field.id]

            // Skip if no value
            if (!value || !value.trim()) continue

            // Get the page (PDF pages are 0-indexed)
            const page = pdfDoc.getPage(field.page - 1)
            const { height: pageHeight } = page.getSize()

            // Calculate font size based on field height (if available)
            const calculatedFontSize = field.height ? Math.min(field.height * 0.8, fontSize) : fontSize

            // Convert coordinates from canvas (top-left origin) to PDF (bottom-left origin)
            // PDF draws text from baseline, so we subtract the font size instead of field height
            const pdfX = field.x
            const pdfY = pageHeight - field.y - calculatedFontSize

            // Draw the text
            page.drawText(value, {
                x: pdfX,
                y: pdfY,
                size: calculatedFontSize,
                font: font,
                color: rgb(0, 0, 0),
            })
        }

        // Serialize the PDF to bytes
        const pdfBytes = await pdfDoc.save()

        return pdfBytes
    } catch (error) {
        console.error('PDF generation error:', error)
        throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

/**
 * Trigger download of a PDF file
 * @param pdfBytes - PDF content as Uint8Array
 * @param filename - Name for the downloaded file
 */
export function downloadPDF(pdfBytes: Uint8Array, filename: string): void {
    // Create a blob from the PDF bytes
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })

    // Create a download link and trigger it
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up the URL
    URL.revokeObjectURL(url)
}
