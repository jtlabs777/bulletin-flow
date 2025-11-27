import * as pdfjsLib from 'pdfjs-dist'

// Configure worker
if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.mjs'
}

export interface FieldDefinition {
    id: string
    label: string
    type: string
    x: number
    y: number
    page: number
    width?: number
    height?: number
}

export interface ExtractedValues {
    [fieldId: string]: string
}

/**
 * Extract text from PDF at specific field positions
 */
export async function extractFieldValues(
    pdfUrl: string,
    fields: FieldDefinition[]
): Promise<ExtractedValues> {
    if (!fields || fields.length === 0) {
        return {}
    }

    // Load PDF document
    const pdf = await pdfjsLib.getDocument(pdfUrl).promise

    const extracted: ExtractedValues = {}

    // Group fields by page for efficiency
    const fieldsByPage = groupFieldsByPage(fields)

    // Process each page
    for (const [pageNum, pageFields] of Object.entries(fieldsByPage)) {
        const page = await pdf.getPage(parseInt(pageNum))
        const textContent = await page.getTextContent()

        // Extract text for each field on this page
        for (const field of pageFields) {
            const value = extractTextAtPosition(
                textContent,
                field.x,
                field.y,
                field.width || 150,
                field.height || 30
            )
            extracted[field.id] = value
        }
    }

    return extracted
}

/**
 * Extract text items that fall within the specified rectangle
 */
function extractTextAtPosition(
    textContent: any,
    x: number,
    y: number,
    width: number,
    height: number
): string {
    const items = textContent.items as any[]
    const matchingItems: string[] = []

    for (const item of items) {
        // PDF.js returns transform matrix [a, b, c, d, e, f]
        // where e is x position and f is y position
        const [, , , , itemX, itemY] = item.transform

        // Calculate item bounds (approximate)
        const itemWidth = item.width || 0
        const itemHeight = item.height || 10

        // Check if text item overlaps with the field bounds
        const overlapsX = itemX < (x + width) && (itemX + itemWidth) > x
        const overlapsY = itemY < (y + height) && (itemY + itemHeight) > (y - height)

        if (overlapsX && overlapsY) {
            matchingItems.push(item.str)
        }
    }

    return matchingItems.join(' ').trim()
}

/**
 * Group fields by page number for efficient processing
 */
function groupFieldsByPage(fields: FieldDefinition[]): Record<number, FieldDefinition[]> {
    return fields.reduce((acc, field) => {
        const page = field.page || 1
        if (!acc[page]) {
            acc[page] = []
        }
        acc[page].push(field)
        return acc
    }, {} as Record<number, FieldDefinition[]>)
}
