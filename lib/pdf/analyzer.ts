/**
 * PDF Text Extraction and Analysis Utilities
 * Extracts text with positions from PDF files for template matching and field extraction
 */

import * as pdfjsLib from 'pdfjs-dist'
import crypto from 'crypto'

// Configure PDF.js worker
if (typeof window === 'undefined') {
    // Server-side: use legacy build
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

/**
 * Represents a text item extracted from a PDF
 */
export interface TextItem {
    text: string
    x: number
    y: number
    width: number
    height: number
    page: number
}

/**
 * Represents PDF metadata
 */
export interface PdfMetadata {
    pageCount: number
    textItems: TextItem[]
    fingerprint: string
}

/**
 * Extract text with positions from a PDF file
 */
export async function extractTextWithPositions(
    pdfUrl: string
): Promise<PdfMetadata> {
    try {
        // Load PDF document
        const loadingTask = pdfjsLib.getDocument(pdfUrl)
        const pdf = await loadingTask.promise

        const allTextItems: TextItem[] = []

        // Process each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum)
            const textContent = await page.getTextContent()

            // Extract text items with positions
            textContent.items.forEach((item: any) => {
                if (item.str && item.str.trim()) {
                    allTextItems.push({
                        text: item.str,
                        x: item.transform[4],
                        y: item.transform[5],
                        width: item.width,
                        height: item.height,
                        page: pageNum
                    })
                }
            })
        }

        // Generate fingerprint
        const fingerprint = generateFingerprint(allTextItems)

        return {
            pageCount: pdf.numPages,
            textItems: allTextItems,
            fingerprint
        }
    } catch (error) {
        console.error('Error extracting text from PDF:', error)
        throw new Error('Failed to extract text from PDF')
    }
}

/**
 * Generate a fingerprint from text items for template matching
 * Uses a simplified version based on text positions and content
 */
export function generateFingerprint(textItems: TextItem[]): string {
    // Sort items by page, then y (top to bottom), then x (left to right)
    const sorted = [...textItems].sort((a, b) => {
        if (a.page !== b.page) return a.page - b.page
        if (Math.abs(a.y - b.y) > 5) return b.y - a.y // Y decreases going down
        return a.x - b.x
    })

    // Create a structure representation
    // Use first ~100 items for fingerprint to balance accuracy and performance
    const significantItems = sorted.slice(0, 100)

    const structure = significantItems.map(item => ({
        t: item.text.substring(0, 20), // First 20 chars
        x: Math.round(item.x / 10) * 10, // Round to nearest 10
        y: Math.round(item.y / 10) * 10,
        p: item.page
    }))

    // Create hash
    const structureStr = JSON.stringify(structure)
    return crypto.createHash('sha256').update(structureStr).digest('hex')
}

/**
 * Find text at a specific position on a specific page
 */
export function findTextAtPosition(
    x: number,
    y: number,
    page: number,
    textItems: TextItem[],
    tolerance: number = 10
): TextItem | null {
    // Find items on the specified page
    const pageItems = textItems.filter(item => item.page === page)

    // Find item at position with tolerance
    const found = pageItems.find(item => {
        return (
            Math.abs(item.x - x) <= tolerance &&
            Math.abs(item.y - y) <= tolerance
        )
    })

    return found || null
}

/**
 * Find text in a rectangular area
 */
export function findTextInArea(
    x: number,
    y: number,
    width: number,
    height: number,
    page: number,
    textItems: TextItem[]
): TextItem[] {
    return textItems.filter(item => {
        if (item.page !== page) return false

        // Check if item overlaps with the area
        const itemRight = item.x + item.width
        const itemBottom = item.y - item.height // Y decreases going down
        const areaRight = x + width
        const areaBottom = y - height

        return (
            item.x < areaRight &&
            itemRight > x &&
            item.y > areaBottom &&
            itemBottom < y
        )
    }).sort((a, b) => {
        // Sort by position: top to bottom, left to right
        if (Math.abs(a.y - b.y) > 5) return b.y - a.y
        return a.x - b.x
    })
}

/**
 * Get text content from an array of text items
 */
export function getTextContent(textItems: TextItem[]): string {
    return textItems.map(item => item.text).join(' ')
}
