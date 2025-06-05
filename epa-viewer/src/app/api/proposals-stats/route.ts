import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request: NextRequest) {
    try {
        // Fetch comment counts grouped by proposal_id
        const { data, error } = await supabase
            .from('epa_comments')
            .select('proposal_id')
            .then(async ({ data, error }) => {
                if (error) throw error;

                // Count comments per proposal
                const commentCounts: Record<string, number> = {};
                data?.forEach(comment => {
                    commentCounts[comment.proposal_id] = (commentCounts[comment.proposal_id] || 0) + 1;
                });

                return { data: commentCounts, error: null };
            });

        if (error) {
            console.error('Error fetching comment counts:', error);
            return NextResponse.json({ error: 'Failed to fetch comment counts' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}