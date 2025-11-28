import { describe, it, expect } from 'vitest'
import { calculateSimilarity } from '@/lib/pdf/matcher'

describe('Template Matcher', () => {
    describe('calculateSimilarity', () => {
        it('should return 1.0 for identical fingerprints', () => {
            const fp1 = 'SABBATH|SCHOOL|DIVINE|SERVICE'
            const fp2 = 'SABBATH|SCHOOL|DIVINE|SERVICE'

            const similarity = calculateSimilarity(fp1, fp2)

            expect(similarity).toBe(1.0)
        })

        it('should return low similarity for completely different fingerprints', () => {
            const fp1 = 'SABBATH|SCHOOL|DIVINE|SERVICE'
            const fp2 = 'COMPLETELY|DIFFERENT|WORDS|HERE'

            const similarity = calculateSimilarity(fp1, fp2)

            expect(similarity).toBeLessThan(0.1)
        })

        it('should return value between 0 and 1 for partial matches', () => {
            const fp1 = 'SABBATH|SCHOOL|DIVINE|SERVICE'
            const fp2 = 'SABBATH|SCHOOL|WORSHIP|PRAISE'

            const similarity = calculateSimilarity(fp1, fp2)

            expect(similarity).toBeGreaterThan(0.3)
            expect(similarity).toBeLessThan(0.8)
        })

        it('should handle empty fingerprints', () => {
            const fp1 = ''
            const fp2 = 'SABBATH|SCHOOL'

            const similarity = calculateSimilarity(fp1, fp2)

            expect(similarity).toBeGreaterThanOrEqual(0)
            expect(similarity).toBeLessThanOrEqual(1)
        })

        it('should be commutative', () => {
            const fp1 = 'SABBATH|SCHOOL|DIVINE'
            const fp2 = 'SABBATH|WORSHIP|DIVINE'

            const sim1 = calculateSimilarity(fp1, fp2)
            const sim2 = calculateSimilarity(fp2, fp1)

            expect(sim1).toBe(sim2)
        })
    })
})
