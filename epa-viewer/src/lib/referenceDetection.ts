export interface ExplicitReference {
    type: 'section' | 'page' | 'cfr';
    value: string;
    fullMatch: string;
    position: [number, number];
    confidence: number;
}

export function detectExplicitReferences(commentText: string): ExplicitReference[] {
    const references: ExplicitReference[] = [];

    // Section references (Section IV.B.2, section IV.A, etc.)
    const sectionPatterns = [
        /[Ss]ection\s+([IVX]+)\.?([A-Z])?\.?(\d+)?/g,
        /[Pp]art\s+([A-Z])\.?(\d+)?/g,
        /[Ss]ubsection\s+([a-z]\)|\(\d+\))/g,
    ];

    // Page references (Page 11656, page 11656 (2nd column))
    const pagePatterns = [
        /[Pp]age\s+(\d+)(?:\s*\(([^)]+)\))?/g,
        /(\d+)\s+FR\s+(\d+)/g,
    ];

    // CFR references (40 CFR 273.13)
    const cfrPatterns = [
        /(\d+)\s+CFR\s+(\d+)\.(\d+)/g,
    ];

    // Process section patterns
    sectionPatterns.forEach(pattern => {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        while ((match = regex.exec(commentText)) !== null) {
            references.push({
                type: 'section',
                value: match[1] + (match[2] ? `.${match[2]}` : '') + (match[3] ? `.${match[3]}` : ''),
                fullMatch: match[0],
                position: [match.index, match.index + match[0].length],
                confidence: 0.95
            });
        }
    });

    // Process page patterns
    pagePatterns.forEach(pattern => {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        while ((match = regex.exec(commentText)) !== null) {
            references.push({
                type: 'page',
                value: match[1] || `${match[1]} FR ${match[2]}`,
                fullMatch: match[0],
                position: [match.index, match.index + match[0].length],
                confidence: 0.90
            });
        }
    });

    // Process CFR patterns
    cfrPatterns.forEach(pattern => {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        while ((match = regex.exec(commentText)) !== null) {
            references.push({
                type: 'cfr',
                value: `${match[1]} CFR ${match[2]}.${match[3]}`,
                fullMatch: match[0],
                position: [match.index, match.index + match[0].length],
                confidence: 0.95
            });
        }
    });

    return references;
}

export function highlightReferences(text: string, references: ExplicitReference[]): string {
    const { annotatedText } = createAnnotatedText(text, [], references, true);
    return annotatedText;
}

export function highlightSectionContent(
    sectionText: string,
    sectionNumber: string,
    explicitReferences: ExplicitReference[]
): string {
    if (!sectionText || explicitReferences.length === 0) return sectionText;

    let highlightedText = sectionText;

    // Look for references that might match this section
    const relevantRefs = explicitReferences.filter(ref => {
        if (ref.type === 'section') {
            // Try to match section numbers (e.g., "IV.B.2" matches section "IV.B.2")
            const refValue = ref.value.toLowerCase();
            const secNumber = sectionNumber.toLowerCase();
            return secNumber.includes(refValue) || refValue.includes(secNumber);
        }
        return false;
    });

    if (relevantRefs.length === 0) return sectionText;

    // Highlight key phrases that might be referenced
    // Look for common regulatory language patterns
    const highlightPatterns = [
        // Regulatory requirements
        /\b(shall|must|required|mandatory|prohibited|forbidden)\b/gi,
        // Specific terms that might be referenced
        /\b(criteria|standard|requirement|procedure|method|process)\b/gi,
        // Numbers and measurements that might be referenced
        /\b\d+(\.\d+)?\s*(percent|%|ppm|mg\/L|degrees?|days?|years?)\b/gi,
        // Dates and deadlines
        /\b(deadline|effective date|compliance date)\b/gi,
    ];

    // Apply highlighting to these patterns
    highlightPatterns.forEach(pattern => {
        highlightedText = highlightedText.replace(pattern, (match) => {
            return `<mark style="background-color: #fef08a; padding: 1px 2px; border-radius: 2px;">${match}</mark>`;
        });
    });

    return highlightedText;
}

export interface TextMatch {
    text: string;
    commentPositions: [number, number][];
    sectionPositions: [number, number][];
    confidence: number;
}

export function findExactTextMatches(commentText: string, sectionText: string): TextMatch[] {
    if (!commentText || !sectionText) return [];

    const matches: TextMatch[] = [];

    // Clean and normalize text for comparison
    const cleanComment = commentText.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const cleanSection = sectionText.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

    // Find phrases of different lengths (3+ words for meaningful matches)
    const minPhraseLength = 3;
    const maxPhraseLength = 15;

    for (let phraseLength = maxPhraseLength; phraseLength >= minPhraseLength; phraseLength--) {
        const commentWords = cleanComment.split(' ');

        for (let i = 0; i <= commentWords.length - phraseLength; i++) {
            const phrase = commentWords.slice(i, i + phraseLength).join(' ');

            // Skip if phrase is too short or contains only common words
            if (phrase.length < 10 || isCommonPhrase(phrase)) continue;

            // Check if this phrase exists in the section
            const sectionIndex = cleanSection.indexOf(phrase);
            if (sectionIndex !== -1) {
                // Find the original positions in the unprocessed text
                const commentPositions = findPhrasePositions(commentText, phrase);
                const sectionPositions = findPhrasePositions(sectionText, phrase);

                if (commentPositions.length > 0 && sectionPositions.length > 0) {
                    // Check if we already have this match (avoid duplicates)
                    const existingMatch = matches.find(m =>
                        Math.abs(m.text.length - phrase.length) < 5 &&
                        m.text.toLowerCase().includes(phrase.substring(0, 10))
                    );

                    if (!existingMatch) {
                        matches.push({
                            text: phrase,
                            commentPositions,
                            sectionPositions,
                            confidence: calculateMatchConfidence(phrase, phraseLength)
                        });
                    }
                }
            }
        }
    }

    // Sort by confidence and length (longer, more confident matches first)
    return matches
        .sort((a, b) => (b.confidence * b.text.length) - (a.confidence * a.text.length))
        .slice(0, 10); // Limit to top 10 matches to avoid overwhelming
}

function isCommonPhrase(phrase: string): boolean {
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must'];
    const words = phrase.split(' ');
    const commonWordCount = words.filter(word => commonWords.includes(word)).length;
    return commonWordCount / words.length > 0.7; // If more than 70% common words, skip
}

function findPhrasePositions(text: string, phrase: string): [number, number][] {
    const positions: [number, number][] = [];
    const lowerText = text.toLowerCase();
    const lowerPhrase = phrase.toLowerCase();

    let startIndex = 0;
    while (true) {
        const index = lowerText.indexOf(lowerPhrase, startIndex);
        if (index === -1) break;

        positions.push([index, index + phrase.length]);
        startIndex = index + 1;
    }

    return positions;
}

function calculateMatchConfidence(phrase: string, phraseLength: number): number {
    let confidence = 0.5; // Base confidence

    // Longer phrases are more confident
    confidence += Math.min(phraseLength * 0.05, 0.3);

    // Phrases with technical/regulatory terms are more confident
    const technicalTerms = ['requirement', 'standard', 'criteria', 'procedure', 'method', 'regulation', 'compliance', 'monitoring', 'assessment', 'evaluation', 'analysis', 'determination', 'implementation', 'enforcement'];
    const hasTechnicalTerms = technicalTerms.some(term => phrase.includes(term));
    if (hasTechnicalTerms) confidence += 0.2;

    // Phrases with numbers/measurements are more confident
    if (/\d+/.test(phrase)) confidence += 0.1;

    return Math.min(confidence, 1.0);
}

export function highlightExactMatches(text: string, matches: TextMatch[], isComment: boolean): string {
    const { annotatedText } = createAnnotatedText(text, matches, [], isComment);
    return annotatedText;
}

export interface AnnotatedMatch {
    id: number;
    text: string;
    commentPositions: [number, number][];
    sectionPositions: [number, number][];
    confidence: number;
    type: 'exact_match' | 'explicit_reference';
}

export function createAnnotatedText(
    text: string,
    exactMatches: TextMatch[],
    explicitRefs: ExplicitReference[],
    isComment: boolean
): { annotatedText: string; annotations: AnnotatedMatch[] } {
    if (exactMatches.length === 0 && explicitRefs.length === 0) {
        return { annotatedText: text, annotations: [] };
    }

    let annotatedText = text;
    const annotations: AnnotatedMatch[] = [];
    let annotationId = 1;

    // Process exact matches first
    exactMatches.forEach(match => {
        const positions = isComment ? match.commentPositions : match.sectionPositions;
        if (positions.length > 0) {
            annotations.push({
                id: annotationId,
                text: match.text,
                commentPositions: match.commentPositions,
                sectionPositions: match.sectionPositions,
                confidence: match.confidence,
                type: 'exact_match'
            });
            annotationId++;
        }
    });

    // Process explicit references
    explicitRefs.forEach(ref => {
        annotations.push({
            id: annotationId,
            text: ref.fullMatch,
            commentPositions: [ref.position],
            sectionPositions: [],
            confidence: ref.confidence,
            type: 'explicit_reference'
        });
        annotationId++;
    });

    // Apply annotations in reverse order to avoid position shifting
    const allPositions = isComment
        ? [...exactMatches.flatMap(m => m.commentPositions.map(pos => ({ match: m, position: pos, type: 'exact_match' as const }))),
        ...explicitRefs.map(ref => ({ match: ref, position: ref.position, type: 'explicit_reference' as const }))]
        : exactMatches.flatMap(m => m.sectionPositions.map(pos => ({ match: m, position: pos, type: 'exact_match' as const })));

    const sortedPositions = allPositions.sort((a, b) => b.position[0] - a.position[0]);

    sortedPositions.forEach(({ position, type }) => {
        const [start, end] = position;
        const before = annotatedText.substring(0, start);
        const matchedText = annotatedText.substring(start, end);
        const after = annotatedText.substring(end);

        // Find the annotation ID for this match
        const annotation = annotations.find(ann =>
            ann.text.toLowerCase().includes(matchedText.toLowerCase()) ||
            matchedText.toLowerCase().includes(ann.text.toLowerCase())
        );

        if (annotation) {
            const annotationMark = `<span class="annotation-ref" data-annotation-id="${annotation.id}">${matchedText}<sup class="annotation-number">[${annotation.id}]</sup></span>`;
            annotatedText = before + annotationMark + after;
        }
    });

    return { annotatedText, annotations };
}