import { describe, it, expect, vi } from 'vitest'
import { extractSingleFieldValue } from '@/lib/pdf/extract-field'
import * as pdfjsLib from 'pdfjs-dist'

// Mock PDF.js
vi.mock('pdfjs-dist', () => ({
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: vi.fn()
}))

describe('Field Extractor', () => {
    describe('extractSingleFieldValue', () => {
        it('should extract text using center-point detection', async () => {
            // Mock PDF.js response
            const mockTextContent = {
                items: [
                    {
                        str: 'Test',
                        transform: [1, 0, 0, 1, 100, 100],
                        width: 30,
                        height: 12
                    },
                    {
                        str: 'Value',
                        transform: [1, 0, 0, 1, 135, 100],
                        width: 35,
                        height: 12
                    }
                ]
            }

            const mockPage = {
                getViewport: vi.fn(() => ({ height: 792 })),
                getTextContent: vi.fn().mockResolvedValue(mockTextContent)
            }

            const mockPdf = {
                getPage: vi.fn().mockResolvedValue(mockPage)
            }

            vi.mocked(pdfjsLib.getDocument).mockReturnValue({
                promise: Promise.resolve(mockPdf)
            } as any)

            const field = {
                id: 'test',
                label: 'Test Field',
                x: 90,
                y: 680,
                width: 80,
                height: 15,
                page: 1,
                type: 'text' as const
            }

            const result = await extractSingleFieldValue('http://example.com/test.pdf', field)

            expect(result).toBe('Test Value')
            expect(mockPage.getTextContent).toHaveBeenCalled()
        })

        it('should only include text whose center is within field boundaries', async () => {
            const mockTextContent = {
                items: [
                    {
                        str: 'Inside',
                        transform: [1, 0, 0, 1, 100, 100], // Center at 115, 106
                        width: 30,
                        height: 12
                    },
                    {
                        str: 'Outside',
                        transform: [1, 0, 0, 1, 200, 100], // Center at 217.5, 106 - outside bounds
                        width: 35,
                        height: 12
                    }
                ]
            }

            const mockPage = {
                getViewport: vi.fn(() => ({ height: 792 })),
                getTextContent: vi.fn().mockResolvedValue(mockTextContent)
            }

            const mockPdf = {
                getPage: vi.fn().mockResolvedValue(mockPage)
            }

            vi.mocked(pdfjsLib.getDocument).mockReturnValue({
                promise: Promise.resolve(mockPdf)
            } as any)

            const field = {
                id: 'test',
                label: 'Test',
                x: 95,
                y: 680,
                width: 40, // Only wide enough for first item
                height: 15,
                page: 1,
                type: 'text' as const
            }

            const result = await extractSingleFieldValue('http://example.com/test.pdf', field)

            expect(result).toBe('Inside')
            expect(result).not.toContain('Outside')
        })

        it('should return empty string when no text found', async () => {
            const mockTextContent = {
                items: []
            }

            const mockPage = {
                getViewport: vi.fn(() => ({ height: 792 })),
                getTextContent: vi.fn().mockResolvedValue(mockTextContent)
            }

            const mockPdf = {
                getPage: vi.fn().mockResolvedValue(mockPage)
            }

            vi.mocked(pdfjsLib.getDocument).mockReturnValue({
                promise: Promise.resolve(mockPdf)
            } as any)

            const field = {
                id: 'test',
                label: 'Empty',
                x: 100,
                y: 100,
                width: 100,
                height: 20,
                page: 1,
                type: 'text' as const
            }

            const result = await extractSingleFieldValue('http://example.com/test.pdf', field)

            expect(result).toBe('')
        })

        it('should handle coordinate conversion correctly', async () => {
            const pageHeight = 792
            const canvasY = 100
            const expectedPdfY = pageHeight - canvasY - 15 // Subtract field height

            const mockTextContent = {
                items: [
                    {
                        str: 'Converted',
                        transform: [1, 0, 0, 1, 100, expectedPdfY],
                        width: 50,
                        height: 12
                    }
                ]
            }

            const mockPage = {
                getViewport: vi.fn(() => ({ height: pageHeight })),
                getTextContent: vi.fn().mockResolvedValue(mockTextContent)
            }

            const mockPdf = {
                getPage: vi.fn().mockResolvedValue(mockPage)
            }

            vi.mocked(pdfjsLib.getDocument).mockReturnValue({
                promise: Promise.resolve(mockPdf)
            } as any)

            const field = {
                id: 'test',
                label: 'Test',
                x: 90,
                y: canvasY,
                width: 70,
                height: 15,
                page: 1,
                type: 'text' as const
            }

            const result = await extractSingleFieldValue('http://example.com/test.pdf', field)

            expect(result).toBe('Converted')
        })

        it('should handle errors gracefully', async () => {
            vi.mocked(pdfjsLib.getDocument).mockReturnValue({
                promise: Promise.reject(new Error('PDF load error'))
            } as any)

            const field = {
                id: 'test',
                label: 'Test',
                x: 100,
                y: 100,
                width: 100,
                height: 20,
                page: 1,
                type: 'text' as const
            }

            const result = await extractSingleFieldValue('http://example.com/test.pdf', field)

            expect(result).toBe('')
        })
    })
})
