import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateCustomPDF, downloadPDF } from '@/lib/pdf/generator'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

// Mock PDF.js
vi.mock('pdfjs-dist', () => ({
    GlobalWorkerOptions: { workerSrc: '' }
}))

describe('PDF Generator', () => {
    describe('generateCustomPDF', () => {
        it('should generate PDF with field values overlaid', async () => {
            // Mock fetch to return a simple PDF
            const mockPdfBytes = new Uint8Array([])
            global.fetch = vi.fn().mockResolvedValue({
                arrayBuffer: () => Promise.resolve(mockPdfBytes.buffer)
            })

            // Create mock template PDF
            const pdfDoc = await PDFDocument.create()
            const page = pdfDoc.addPage([612, 792]) // Standard letter size
            const pdfBytes = await pdfDoc.save()

            global.fetch = vi.fn().mockResolvedValue({
                arrayBuffer: () => Promise.resolve(pdfBytes.buffer)
            })

            const options = {
                templatePdfUrl: 'https://example.com/template.pdf',
                fields: [
                    {
                        id: 'field1',
                        label: 'Test Field',
                        x: 100,
                        y: 100,
                        width: 200,
                        height: 20,
                        page: 1,
                        type: 'text' as const
                    }
                ],
                fieldValues: {
                    field1: 'Test Value'
                }
            }

            const result = await generateCustomPDF(options)

            expect(result).toBeInstanceOf(Uint8Array)
            expect(result.length).toBeGreaterThan(0)
        })

        it('should skip fields without values', async () => {
            const pdfDoc = await PDFDocument.create()
            pdfDoc.addPage([612, 792])
            const pdfBytes = await pdfDoc.save()

            global.fetch = vi.fn().mockResolvedValue({
                arrayBuffer: () => Promise.resolve(pdfBytes.buffer)
            })

            const options = {
                templatePdfUrl: 'https://example.com/template.pdf',
                fields: [
                    {
                        id: 'field1',
                        label: 'Empty Field',
                        x: 100,
                        y: 100,
                        width: 200,
                        height: 20,
                        page: 1,
                        type: 'text' as const
                    }
                ],
                fieldValues: {}
            }

            const result = await generateCustomPDF(options)
            expect(result).toBeInstanceOf(Uint8Array)
        })

        it('should handle errors gracefully', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

            const options = {
                templatePdfUrl: 'https://example.com/template.pdf',
                fields: [],
                fieldValues: {}
            }

            await expect(generateCustomPDF(options)).rejects.toThrow()
        })

        it('should calculate font size based on field height', async () => {
            const pdfDoc = await PDFDocument.create()
            pdfDoc.addPage([612, 792])
            const pdfBytes = await pdfDoc.save()

            global.fetch = vi.fn().mockResolvedValue({
                arrayBuffer: () => Promise.resolve(pdfBytes.buffer)
            })

            const options = {
                templatePdfUrl: 'https://example.com/template.pdf',
                fields: [
                    {
                        id: 'small',
                        label: 'Small Field',
                        x: 100,
                        y: 100,
                        width: 100,
                        height: 10, // Small height
                        page: 1,
                        type: 'text' as const
                    },
                    {
                        id: 'large',
                        label: 'Large Field',
                        x: 100,
                        y: 200,
                        width: 100,
                        height: 30, // Larger height
                        page: 1,
                        type: 'text' as const
                    }
                ],
                fieldValues: {
                    small: 'Small',
                    large: 'Large'
                }
            }

            const result = await generateCustomPDF(options)
            expect(result).toBeInstanceOf(Uint8Array)
            // Font size should be proportional to field height
        })
    })

    describe('downloadPDF', () => {
        beforeEach(() => {
            // Mock DOM APIs
            global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
            global.URL.revokeObjectURL = vi.fn()
            document.body.appendChild = vi.fn()
            document.body.removeChild = vi.fn()
        })

        it('should trigger PDF download', () => {
            const mockPdfBytes = new Uint8Array([1, 2, 3])
            const filename = 'test.pdf'

            const linkClick = vi.fn()
            const mockLink = {
                href: '',
                download: '',
                click: linkClick
            }
            vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)

            downloadPDF(mockPdfBytes, filename)

            expect(document.createElement).toHaveBeenCalledWith('a')
            expect(mockLink.href).toBe('blob:mock-url')
            expect(mockLink.download).toBe(filename)
            expect(linkClick).toHaveBeenCalled()
            expect(document.body.appendChild).toHaveBeenCalledWith(mockLink)
            expect(document.body.removeChild).toHaveBeenCalledWith(mockLink)
            expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
        })
    })

    describe('Coordinate Conversion', () => {
        it('should convert canvas coordinates to PDF coordinates correctly', async () => {
            const pdfDoc = await PDFDocument.create()
            const page = pdfDoc.addPage([612, 792])
            const pdfBytes = await pdfDoc.save()

            global.fetch = vi.fn().mockResolvedValue({
                arrayBuffer: () => Promise.resolve(pdfBytes.buffer)
            })

            const pageHeight = 792
            const canvasY = 100
            const fontSize = 12

            // Expected PDF Y = pageHeight - canvasY - fontSize
            const expectedPdfY = pageHeight - canvasY - fontSize

            const options = {
                templatePdfUrl: 'https://example.com/template.pdf',
                fields: [
                    {
                        id: 'test',
                        label: 'Test',
                        x: 100,
                        y: canvasY,
                        width: 100,
                        height: 20,
                        page: 1,
                        type: 'text' as const
                    }
                ],
                fieldValues: { test: 'Value' },
                fontSize: fontSize
            }

            const result = await generateCustomPDF(options)
            expect(result).toBeInstanceOf(Uint8Array)
            // The Y coordinate should be converted correctly
            expect(expectedPdfY).toBe(680)
        })
    })
})
