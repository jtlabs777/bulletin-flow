/**
 * Template Matching Utilities
 * Matches bulletins to templates based on layout fingerprints
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Template interface
 */
export interface Template {
    id: string
    church_id: string
    name: string
    layout_fingerprint: string
    field_definitions: FieldDefinition[]
    created_at: string
}

/**
 * Field definition interface
 */
export interface FieldDefinition {
    id: string
    label: string
    x: number
    y: number
    width: number
    height: number
    page: number
    type?: 'text' | 'date' | 'number'
}

/**
 * Match result interface
 */
export interface MatchResult {
    template: Template | null
    confidence: number
}

/**
 * Find the best matching template for a given fingerprint
 */
export async function findBestMatch(
    fingerprint: string,
    churchId: string
): Promise<MatchResult> {
    const supabase = await createClient()

    // Get all templates for this church
    const { data: templates, error } = await supabase
        .from('templates')
        .select('*')
        .eq('church_id', churchId)

    if (error || !templates || templates.length === 0) {
        return { template: null, confidence: 0 }
    }

    // Calculate similarity for each template
    const matches = templates.map(template => ({
        template,
        confidence: calculateSimilarity(fingerprint, template.layout_fingerprint)
    }))

    // Sort by confidence (highest first)
    matches.sort((a, b) => b.confidence - a.confidence)

    // Return best match if confidence is above threshold
    const bestMatch = matches[0]
    const threshold = 0.7 // 70% similarity required

    if (bestMatch.confidence >= threshold) {
        return bestMatch
    }

    return { template: null, confidence: bestMatch.confidence }
}

/**
 * Calculate similarity between two fingerprints
 * Returns a value between 0 and 1 (1 = identical)
 */
export function calculateSimilarity(fp1: string, fp2: string): number {
    if (fp1 === fp2) return 1.0

    // Use Hamming distance for hex strings
    let differences = 0
    const length = Math.min(fp1.length, fp2.length)

    for (let i = 0; i < length; i++) {
        if (fp1[i] !== fp2[i]) {
            differences++
        }
    }

    // Account for length differences
    differences += Math.abs(fp1.length - fp2.length)

    // Calculate similarity (0 to 1)
    const maxLength = Math.max(fp1.length, fp2.length)
    const similarity = 1 - (differences / maxLength)

    return Math.max(0, Math.min(1, similarity))
}

/**
 * Get all templates for a church
 */
export async function getChurchTemplates(churchId: string): Promise<Template[]> {
    const supabase = await createClient()

    const { data: templates, error } = await supabase
        .from('templates')
        .select('*')
        .eq('church_id', churchId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching templates:', error)
        return []
    }

    return templates || []
}

/**
 * Create a template from a bulletin
 */
export async function createTemplate(
    bulletinId: string,
    name: string,
    fieldDefinitions: FieldDefinition[],
    fingerprint: any,
    churchId: string
): Promise<string> {
    const supabase = await createClient()

    // Update bulletin to be a template with all template data
    const { error: bulletinError } = await supabase
        .from('bulletins')
        .update({
            is_template: true,
            template_name: name,
            template_fields: fieldDefinitions,
            template_layout_fingerprint: fingerprint,
            layout_fingerprint: typeof fingerprint === 'string' ? fingerprint : JSON.stringify(fingerprint)
        })
        .eq('id', bulletinId)
        .eq('church_id', churchId)

    if (bulletinError) {
        console.error('Error updating bulletin template:', bulletinError)
        throw bulletinError
    }

    return bulletinId
}
