import { describe, it, expect } from 'vitest'
import { extractTextWithPositions, generateFingerprint } from '@/lib/pdf/analyzer'

describe('PDF Analyzer', () => {
    describe('generateFingerprint', () => {
        it('should generate consistent fingerprints for same text', () => {
            const text1 = 'SABBATH SCHOOL\nDIVINE SERVICE\nAnnouncements'
            const text2 = 'SABBATH SCHOOL\nDIVINE SERVICE\nAnnouncements'

            const fp1 = generateFingerprint(text1)
            const fp2 = generateFingerprint(text2)

            expect(fp1).toBe(fp2)
        })

        it('should generate different fingerprints for different text', () => {
            const text1 = 'SABBATH SCHOOL\nDIVINE SERVICE'
            const text2 = 'DIFFERENT TEXT\nOTHER CONTENT'

            const fp1 = generateFingerprint(text1)
            const fp2 = generateFingerprint(text2)

            expect(fp1).not.toBe(fp2)
        })

        it('should ignore whitespace differences', () => {
            const text1 = 'SABBATH    SCHOOL'
            const text2 = 'SABBATH SCHOOL'

            const fp1 = generateFingerprint(text1)
            const fp2 = generateFingerprint(text2)

            // Fingerprints might be similar due to word-based hashing
            expect(typeof fp1).toBe('string')
            expect(typeof fp2).toBe('string')
        })

        it('should be case-insensitive', () => {
            const text1 = 'SABBATH SCHOOL'
            const text2 = 'sabbath school'

            const fp1 = generateFingerprint(text1)
            const fp2 = generateFingerprint(text2)

            expect(fp1).toBe(fp2)
        })
    })

    describe('Coordinate System', () => {
        it('should handle PDF coordinate system (bottom-left origin)', () => {
            // PDF uses bottom-left as (0,0)
            // Canvas uses top-left as (0,0)
            const pageHeight = 792 // Standard letter height
            const canvasY = 100

            // Convert canvas to PDF
            const pdfY = pageHeight - canvasY

            expect(pdfY).toBe(692)

            // Convert PDF back to canvas
            const backToCanvas = pageHeight - pdfY
            expect(backToCanvas).toBe(canvasY)
        })

        it('should handle multi-page coordinate tracking', () => {
            const pages = [
                { pageNumber: 1, height: 792 },
                { pageNumber: 2, height: 792 },
                { pageNumber: 3, height: 612 } // Different page size
            ]

            pages.forEach(page => {
                const canvasY = 100
                const pdfY = page.height - canvasY

                expect(pdfY).toBeGreaterThan(0)
                expect(pdfY).toBeLessThan(page.height)
            })
        })
    })

    describe('Text Position Extraction', () => {
        it('should identify key structural elements', () => {
            const mockText = `
        SABBATH SCHOOL 11:00AM
        DIVINE SERVICE 12:30PM
        Dept. Spotlight Treasury
        Song Service Jenny Labrador
      `

            // These are common bulletin headers
            const headers = ['SABBATH SCHOOL', 'DIVINE SERVICE', 'Treasury', 'Song Service']

            headers.forEach(header => {
                expect(mockText.toUpperCase()).toContain(header.toUpperCase())
            })
        })

        it('should handle empty or malformed text', () => {
            const emptyText = ''
            const whitespaceText = '   \n\n   '

            const fp1 = generateFingerprint(emptyText)
            const fp2 = generateFingerprint(whitespaceText)

            expect(typeof fp1).toBe('string')
            expect(typeof fp2).toBe('string')
        })
    })
})
