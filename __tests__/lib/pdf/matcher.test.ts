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

        it('should return 0.0 for completely different fingerprints', () => {
            const fp1 = 'SABBATH|SCHOOL|DIVINE|SERVICE'
            const fp2 = 'COMPLETELY|DIFFERENT|WORDS|HERE'

            const similarity = calculateSimilarity(fp1, fp2)

            expect(similarity).toBe(0.0)
        })

        it('should return value between 0 and 1 for partial matches', () => {
            const fp1 = 'SABBATH|SCHOOL|DIVINE|SERVICE'
            const fp2 = 'SABBATH|SCHOOL|WORSHIP|PRAISE' // 2 out of 4 match

            const similarity = calculateSimilarity(fp1, fp2)

            expect(similarity).toBeGreaterThan(0)
            expect(similarity).toBeLessThan(1)
            expect(similarity).toBeCloseTo(0.5, 1) // ~50% match
        })

        it('should handle empty fingerprints', () => {
            const fp1 = ''
            const fp2 = 'SABBATH|SCHOOL'

            const similarity = calculateSimilarity(fp1, fp2)

            expect(similarity).toBeGreaterThanOrEqual(0)
            expect(similarity).toBeLessThanOrEqual(1)
        })

        it('should be commutative (order doesn\'t matter)', () => {
            const fp1 = 'SABBATH|SCHOOL|DIVINE'
            const fp2 = 'SABBATH|WORSHIP|DIVINE'

            const sim1 = calculateSimilarity(fp1, fp2)
            const sim2 = calculateSimilarity(fp2, fp1)

            expect(sim1).toBe(sim2)
        })

        it('should handle case sensitivity consistently', () => {
            const fp1 = 'sabbath|school|divine'
            const fp2 = 'SABBATH|SCHOOL|DIVINE'

            // Fingerprints should be normalized before comparison
            const similarity = calculateSimilarity(fp1.toUpperCase(), fp2.toUpperCase())

            expect(similarity).toBe(1.0)
        })

        it('should recognize high similarity for same template with minor differences', () => {
            const fp1 = 'SABBATH|SCHOOL|11:00AM|DIVINE|SERVICE|12:30PM|ANNOUNCEMENTS'
            const fp2 = 'SABBATH|SCHOOL|11:15AM|DIVINE|SERVICE|12:30PM|ANNOUNCEMENTS' // Time changed

            const similarity = calculateSimilarity(fp1, fp2)

            // Should still be quite similar despite time change
            expect(similarity).toBeGreaterThan(0.8)
        })

        it('should return low similarity for different bulletin templates', () => {
            const sundayBulletin = 'SABBATH|SCHOOL|DIVINE|SERVICE|BENEDICTION'
            const weekdayBulletin = 'PRAYER|MEETING|BIBLE|STUDY|DISCUSSION'

            const similarity = calculateSimilarity(sundayBulletin, weekdayBulletin)

            expect(similarity).toBeLessThan(0.3)
        })
    })

    describe('Template Matching Threshold', () => {
        it('should identify match above 70% threshold', () => {
            const MATCH_THRESHOLD = 0.7

            const fp1 = 'WORD1|WORD2|WORD3|WORD4|WORD5|WORD6|WORD7|WORD8|WORD9|WORD10'
            const fp2 = 'WORD1|WORD2|WORD3|WORD4|WORD5|WORD6|WORD7|DIFF1|DIFF2|DIFF3' // 7/10 match

            const similarity = calculateSimilarity(fp1, fp2)

            expect(similarity).toBeGreaterThan(MATCH_THRESHOLD)
        })

        it('should reject match below 70% threshold', () => {
            const MATCH_THRESHOLD = 0.7

            const fp1 = 'WORD1|WORD2|WORD3|WORD4|WORD5|WORD6|WORD7|WORD8|WORD9|WORD10'
            const fp2 = 'WORD1|WORD2|WORD3|DIFF1|DIFF2|DIFF3|DIFF4|DIFF5|DIFF6|DIFF7' // 3/10 match

            const similarity = calculateSimilarity(fp1, fp2)

            expect(similarity).toBeLessThan(MATCH_THRESHOLD)
        })
    })
})
