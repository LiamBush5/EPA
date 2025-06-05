import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Proposal {
    proposal_id: string;
    docket_id: string;
    title: string;
    description: string;
    agency: string;
    proposal_date: string | null;
    comment_period_start: string | null;
    comment_period_end: string | null;
    status: string;
    regulation_type: string;
    source_url: string;
    metadata: any;
    created_at: string;
}

export interface DocumentSection {
    section_id: string;
    section_number: string;
    section_title: string;
    section_text: string;
    parent_section_id: string | null;
    hierarchy_level: number;
    hierarchy_path: string;
    proposal_id: string;
}

export interface Comment {
    id: string;
    comment_id: string;
    commenter_name: string;
    organization: string;
    comment_date: string;
    comment_text: string;
    has_attachments: boolean;
    attachment_count: number;
    attachment_contents?: Array<{ filename: string; text: string }>;
    combined_text?: string;
    source_url: string;
    proposal_id: string;
}

export interface CommentSectionMatch {
    id: string;
    comment_id: string;
    section_id: string;
    similarity_score: number;
    match_rank: number;
    proposal_id: string;
}

// Fetch all proposals
export async function fetchProposals() {
    const { data, error } = await supabase
        .from('epa_proposals')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching proposals:', error);
        return [];
    }

    return data as Proposal[];
}

// Fetch a single proposal by ID
export async function fetchProposal(proposalId: string) {
    const { data, error } = await supabase
        .from('epa_proposals')
        .select('*')
        .eq('proposal_id', proposalId)
        .single();

    if (error) {
        console.error('Error fetching proposal:', error);
        return null;
    }

    return data as Proposal;
}

export async function fetchDocumentSections(proposalId?: string) {
    let query = supabase
        .from('document_sections')
        .select('*')
        .order('hierarchy_level')
        .order('section_number');

    if (proposalId) {
        query = query.eq('proposal_id', proposalId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching document sections:', error);
        return [];
    }

    return data as DocumentSection[];
}

export async function fetchComments(proposalId?: string) {
    let query = supabase
        .from('epa_comments')
        .select('*, attachment_contents');

    if (proposalId) {
        query = query.eq('proposal_id', proposalId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching comments:', error);
        return [];
    }

    return data as Comment[];
}

export async function fetchCommentSectionMatches(proposalId?: string) {
    let query = supabase
        .from('comment_section_matches')
        .select('*');

    if (proposalId) {
        query = query.eq('proposal_id', proposalId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching comment-section matches:', error);
        return [];
    }

    return data as CommentSectionMatch[];
}

export async function fetchTopCommentMatches(proposalId?: string) {
    let query = supabase
        .from('top_comment_matches')
        .select('*');

    if (proposalId) {
        query = query.eq('proposal_id', proposalId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching top comment matches:', error);
        return [];
    }

    return data;
}

export async function fetchSectionWithComments(sectionId: string) {
    // Fetch the section
    const { data: section, error: sectionError } = await supabase
        .from('document_sections')
        .select('*')
        .eq('section_id', sectionId)
        .single();

    if (sectionError) {
        console.error('Error fetching section:', sectionError);
        return { section: null, comments: [] };
    }

    // Fetch comments matched to this section (filter by proposal_id implicitly through section)
    const { data: matches, error: matchError } = await supabase
        .from('comment_section_matches')
        .select('*')
        .eq('section_id', sectionId)
        .eq('proposal_id', section.proposal_id)
        .order('similarity_score', { ascending: false });

    if (matchError) {
        console.error('Error fetching matches:', matchError);
        return { section, comments: [] };
    }

    // Fetch the actual comments
    const commentIds = matches.map(match => match.comment_id);

    if (commentIds.length === 0) {
        return { section, comments: [] };
    }

    const { data: comments, error: commentsError } = await supabase
        .from('epa_comments')
        .select('*, attachment_contents')
        .in('comment_id', commentIds)
        .eq('proposal_id', section.proposal_id);

    if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        return { section, comments: [] };
    }

    // Combine comments with their match scores
    const commentsWithScores = comments.map(comment => {
        const match = matches.find(m => m.comment_id === comment.comment_id);
        return {
            ...comment,
            similarity_score: match ? match.similarity_score : 0,
            match_rank: match ? match.match_rank : 0
        };
    }).sort((a, b) => b.similarity_score - a.similarity_score);

    return { section, comments: commentsWithScores };
}

export async function fetchCommentWithSections(commentId: string) {
    // Fetch the comment
    const { data: comment, error: commentError } = await supabase
        .from('epa_comments')
        .select('*, attachment_contents')
        .eq('comment_id', commentId)
        .single();

    if (commentError) {
        console.error('Error fetching comment:', commentError);
        return { comment: null, sections: [] };
    }

    // Fetch sections matched to this comment (filter by proposal_id)
    const { data: matches, error: matchError } = await supabase
        .from('comment_section_matches')
        .select('*')
        .eq('comment_id', commentId)
        .eq('proposal_id', comment.proposal_id)
        .order('similarity_score', { ascending: false });

    if (matchError) {
        console.error('Error fetching matches:', matchError);
        return { comment, sections: [] };
    }

    // Fetch the actual sections
    const sectionIds = matches.map(match => match.section_id);

    if (sectionIds.length === 0) {
        return { comment, sections: [] };
    }

    const { data: sections, error: sectionsError } = await supabase
        .from('document_sections')
        .select('*')
        .in('section_id', sectionIds)
        .eq('proposal_id', comment.proposal_id);

    if (sectionsError) {
        console.error('Error fetching sections:', sectionsError);
        return { comment, sections: [] };
    }

    // Combine sections with their match scores
    const sectionsWithScores = sections.map(section => {
        const match = matches.find(m => m.section_id === section.section_id);
        return {
            ...section,
            similarity_score: match ? match.similarity_score : 0,
            match_rank: match ? match.match_rank : 0
        };
    }).sort((a, b) => b.similarity_score - a.similarity_score);

    return { comment, sections: sectionsWithScores };
}

export async function fetchSectionWithBestMatchedComments(sectionId: string) {
    // Fetch the section
    const { data: section, error: sectionError } = await supabase
        .from('document_sections')
        .select('*')
        .eq('section_id', sectionId)
        .single();

    if (sectionError) {
        console.error('Error fetching section:', sectionError);
        return { section: null, comments: [] };
    }

    // Fetch ALL comments and their matches for this proposal to determine best matches
    const { data: allComments, error: commentsError } = await supabase
        .from('epa_comments')
        .select('*, attachment_contents')
        .eq('proposal_id', section.proposal_id);

    if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        return { section, comments: [] };
    }

    const { data: allMatches, error: matchesError } = await supabase
        .from('comment_section_matches')
        .select('*')
        .eq('proposal_id', section.proposal_id);

    if (matchesError) {
        console.error('Error fetching matches:', matchesError);
        return { section, comments: [] };
    }

    const { data: allSections, error: sectionsError } = await supabase
        .from('document_sections')
        .select('*')
        .eq('proposal_id', section.proposal_id);

    if (sectionsError) {
        console.error('Error fetching sections:', sectionsError);
        return { section, comments: [] };
    }

    // Import the single match logic
    const { findSingleBestMatch } = await import('./singleMatchLogic');

    // Find comments where this section is their best match
    const commentsWithBestMatch = allComments
        .map(comment => {
            // Get all matches for this comment
            const commentMatches = allMatches.filter(match => match.comment_id === comment.comment_id);

            // Convert to the format expected by findSingleBestMatch
            const sectionsWithScores = commentMatches.map(match => {
                const matchedSection = allSections.find(s => s.section_id === match.section_id);
                return matchedSection ? {
                    ...matchedSection,
                    similarity_score: match.similarity_score,
                    match_rank: match.match_rank
                } : null;
            }).filter(Boolean);

            // Find the single best match
            const bestMatch = findSingleBestMatch(comment, allSections, sectionsWithScores);

            // Check if this section is the best match for this comment
            if (bestMatch && bestMatch.section_id === sectionId) {
                return {
                    ...comment,
                    similarity_score: bestMatch.similarity_score,
                    match_rank: 0 // Using match_rank for UI compatibility, not from bestMatch
                };
            }
            return null;
        })
        .filter(Boolean)
        .sort((a, b) => b.similarity_score - a.similarity_score);

    return { section, comments: commentsWithBestMatch };
}