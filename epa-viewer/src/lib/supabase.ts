import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

export interface DocumentSection {
    section_id: string;
    section_number: string;
    section_title: string;
    section_text: string;
    parent_section_id: string | null;
    hierarchy_level: number;
    hierarchy_path: string;
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
    source_url: string;
}

export interface CommentSectionMatch {
    id: string;
    comment_id: string;
    section_id: string;
    similarity_score: number;
    match_rank: number;
}

export async function fetchDocumentSections() {
    const { data, error } = await supabase
        .from('document_sections')
        .select('*')
        .order('hierarchy_path');

    if (error) {
        console.error('Error fetching document sections:', error);
        return [];
    }

    return data as DocumentSection[];
}

export async function fetchComments() {
    const { data, error } = await supabase
        .from('epa_comments')
        .select('*');

    if (error) {
        console.error('Error fetching comments:', error);
        return [];
    }

    return data as Comment[];
}

export async function fetchCommentSectionMatches() {
    const { data, error } = await supabase
        .from('comment_section_matches')
        .select('*');

    if (error) {
        console.error('Error fetching comment-section matches:', error);
        return [];
    }

    return data as CommentSectionMatch[];
}

export async function fetchTopCommentMatches() {
    const { data, error } = await supabase
        .from('top_comment_matches')
        .select('*');

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

    // Fetch comments matched to this section
    const { data: matches, error: matchError } = await supabase
        .from('comment_section_matches')
        .select('*')
        .eq('section_id', sectionId)
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
        .select('*')
        .in('comment_id', commentIds);

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
        .select('*')
        .eq('comment_id', commentId)
        .single();

    if (commentError) {
        console.error('Error fetching comment:', commentError);
        return { comment: null, sections: [] };
    }

    // Fetch sections matched to this comment
    const { data: matches, error: matchError } = await supabase
        .from('comment_section_matches')
        .select('*')
        .eq('comment_id', commentId)
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
        .in('section_id', sectionIds);

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