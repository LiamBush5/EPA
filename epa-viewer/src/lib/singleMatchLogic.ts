import { detectExplicitReferences, ExplicitReference } from './referenceDetection';

export interface SingleBestMatch {
    section_id: string;
    section_title: string;
    section_number: string;
    similarity_score: number;
    confidence_level: 'very_high' | 'high' | 'medium' | 'low';
    match_reason: string;
    explicit_reference?: ExplicitReference;
    is_explicit_match: boolean;
}

export function findSingleBestMatch(
    comment: any,
    sections: any[],
    originalMatches: any[]
): SingleBestMatch | null {
    // First, check for explicit references
    const explicitRefs = detectExplicitReferences(comment.comment_text);

    if (explicitRefs.length > 0) {
        // Try to find a section that matches the explicit reference
        for (const ref of explicitRefs) {
            const matchingSection = findSectionByReference(ref, sections);
            if (matchingSection) {
                return {
                    section_id: matchingSection.section_id,
                    section_title: matchingSection.section_title,
                    section_number: matchingSection.section_number,
                    similarity_score: 0.98, // Very high score for explicit matches
                    confidence_level: 'very_high',
                    match_reason: `Explicit reference found: "${ref.fullMatch}"`,
                    explicit_reference: ref,
                    is_explicit_match: true
                };
            }
        }
    }

    // If no explicit match found, use the highest semantic similarity match
    if (originalMatches.length === 0) {
        return null;
    }

    // Get the best semantic match
    const bestMatch = originalMatches[0]; // Already sorted by similarity_score
    const section = sections.find(s => s.section_id === bestMatch.section_id);

    if (!section) {
        return null;
    }

    // Determine confidence level based on similarity score
    let confidenceLevel: 'very_high' | 'high' | 'medium' | 'low';
    if (bestMatch.similarity_score >= 0.85) confidenceLevel = 'very_high';
    else if (bestMatch.similarity_score >= 0.75) confidenceLevel = 'high';
    else if (bestMatch.similarity_score >= 0.65) confidenceLevel = 'medium';
    else confidenceLevel = 'low';

    // Create match reason based on comment characteristics
    let matchReason = `Semantic similarity: ${(bestMatch.similarity_score * 100).toFixed(1)}%`;

    // Add context about the comment
    const textLength = comment.comment_text.length;
    if (comment.organization) {
        matchReason += ` (Professional organization: ${comment.organization})`;
    }
    if (textLength > 1000) {
        matchReason += ` (Detailed comment)`;
    } else if (textLength < 100) {
        matchReason += ` (Brief comment)`;
    }

    return {
        section_id: bestMatch.section_id,
        section_title: section.section_title,
        section_number: section.section_number,
        similarity_score: bestMatch.similarity_score,
        confidence_level: confidenceLevel,
        match_reason: matchReason,
        is_explicit_match: false
    };
}

function findSectionByReference(ref: ExplicitReference, sections: any[]): any | null {
    switch (ref.type) {
        case 'section':
            // Try to match section numbers (IV.B.2, IV.A, etc.)
            return sections.find(s => {
                if (!s.section_number) return false;

                // Direct match
                if (s.section_number === ref.value) return true;

                // Partial match (e.g., "IV.B" matches "IV.B.2")
                if (s.section_number.startsWith(ref.value + '.') ||
                    ref.value.startsWith(s.section_number + '.')) return true;

                // Check if section title contains the reference
                if (s.section_title?.toLowerCase().includes(`section ${ref.value.toLowerCase()}`)) return true;

                return false;
            });

        case 'page':
            // For page references, we could implement page-to-section mapping
            // For now, return null but this could be enhanced with a mapping table
            return null;

        case 'cfr':
            // Look for CFR references in section text or title
            return sections.find(s =>
                s.section_text?.includes(ref.value) ||
                s.section_title?.includes(ref.value)
            );

        default:
            return null;
    }
}