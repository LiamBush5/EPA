import { NextRequest, NextResponse } from 'next/server';
import { fetchSectionWithBestMatchedComments } from '../../../../lib/supabase';
import { generateCommentsSummary } from '../../../../lib/openai';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { sectionTitle, sectionNumber } = await request.json();
        const { id } = await params;

        // Fetch the section and its best matched comments
        const { section, comments } = await fetchSectionWithBestMatchedComments(id);

        if (!section) {
            return NextResponse.json(
                { error: 'Section not found' },
                { status: 404 }
            );
        }

        // Generate AI summary
        const summary = await generateCommentsSummary(
            comments,
            sectionTitle,
            sectionNumber
        );

        return NextResponse.json({ summary });
    } catch (error) {
        console.error('Error generating AI summary:', error);
        return NextResponse.json(
            { error: 'Failed to generate AI summary' },
            { status: 500 }
        );
    }
}