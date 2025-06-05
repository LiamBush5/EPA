import Link from 'next/link';
import { fetchSectionWithBestMatchedComments } from '../../../lib/supabase';
import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import { detectExplicitReferences, highlightReferences, findExactTextMatches, highlightExactMatches } from '../../../lib/referenceDetection';
import AttachmentContent from '../../../components/AttachmentContent';
import AISummary from '../../../components/AISummary';

export const dynamic = 'force-dynamic';

// @ts-ignore - Temporarily bypassing type check for deployment
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { section } = await fetchSectionWithBestMatchedComments(id);

    return {
        title: section ? `${section.section_number} ${section.section_title}` : 'Section Detail',
        description: section ? `View details and comment matches for section ${section.section_number}` : 'Section not found',
    };
}

// @ts-ignore - Temporarily bypassing type check for deployment
export default async function SectionPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ proposal?: string }>;
}) {
    const { id } = await params;
    const resolvedSearchParams = await searchParams;
    const proposalId = resolvedSearchParams.proposal;
    const { section, comments } = await fetchSectionWithBestMatchedComments(id);

    // Find exact text matches between all comments and section content
    const allExactMatches = section ? comments.flatMap(comment =>
        findExactTextMatches(comment.comment_text, section.section_text)
    ) : [];

    // Highlight section content with exact matches from comments
    let highlightedSectionText = section?.section_text || '';
    if (allExactMatches.length > 0) {
        highlightedSectionText = highlightExactMatches(highlightedSectionText, allExactMatches, false);
    }

    if (!section) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Section Not Found</h2>
                <p className="text-gray-600 mb-6">The section you are looking for does not exist or has been removed.</p>
                <Link
                    href={proposalId ? `/?proposal=${proposalId}` : '/'}
                    className="openai-button"
                >
                    Back to Proposal
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <div className="flex flex-col items-start">
                <Link
                    href={proposalId ? `/?proposal=${proposalId}` : '/'}
                    className="text-sm text-gray-600 hover:text-gray-900 mb-6 flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to proposal overview
                </Link>

                <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Section {section.section_number}
                    </span>
                    <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        Level {section.hierarchy_level}
                    </span>
                </div>

                <h1 className="text-3xl font-semibold tracking-tight mb-4">{section.section_title}</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <div className="openai-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium">Section Content</h2>
                            {allExactMatches.length > 0 && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                    {allExactMatches.length} exact match{allExactMatches.length !== 1 ? 'es' : ''} highlighted
                                </span>
                            )}
                        </div>
                        <div className="openai-prose">
                            {highlightedSectionText ? (
                                <div dangerouslySetInnerHTML={{ __html: highlightedSectionText.replace(/\n/g, '<br>') }} />
                            ) : (
                                <div>No content available for this section.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="openai-card p-6">
                        <h2 className="text-lg font-medium mb-4">Match Statistics</h2>
                        <div className="space-y-4">
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Best Match Comments</div>
                                <div className="text-2xl font-bold text-blue-600">{comments.length}</div>
                            </div>

                            <div>
                                <div className="text-sm text-gray-500 mb-1">Average Similarity Score</div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {comments.length > 0
                                        ? (comments.reduce((acc, c) => acc + c.similarity_score, 0) / comments.length).toFixed(2)
                                        : '0.00'
                                    }
                                </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                <p className="text-sm text-gray-600">
                                    {comments.length === 0
                                        ? 'No comments have this section as their best match.'
                                        : `This section is the best match for ${comments.length} comment${comments.length !== 1 ? 's' : ''}, indicating ${comments.length > 10
                                            ? 'significant public interest.'
                                            : comments.length > 5
                                                ? 'moderate public interest.'
                                                : 'some public interest.'
                                        }`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    <AISummary
                        sectionId={section.section_id}
                        sectionTitle={section.section_title}
                        sectionNumber={section.section_number}
                        commentCount={comments.length}
                    />
                </div>
            </div>

            {comments.length > 0 && (
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight mb-4">Best Matched Comments</h2>
                    <p className="text-gray-600 mb-6">
                        The following comments have this section as their single best match. Each comment is only counted once for its most relevant section. Explicit references are highlighted in yellow.
                    </p>

                    <div className="openai-card">
                        <ul className="divide-y divide-gray-100">
                            {comments.map(comment => {
                                const explicitRefs = detectExplicitReferences(comment.comment_text);
                                const exactMatches = section ? findExactTextMatches(comment.comment_text, section.section_text) : [];

                                // Combine explicit references and exact matches for highlighting
                                let highlightedText = highlightReferences(comment.comment_text, explicitRefs);
                                if (exactMatches.length > 0) {
                                    highlightedText = highlightExactMatches(highlightedText, exactMatches, true);
                                }

                                return (
                                    <li key={comment.id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="mb-4 flex justify-between items-start">
                                            <div>
                                                <h3 className="font-medium">
                                                    {comment.commenter_name}
                                                    {comment.organization && (
                                                        <span className="text-gray-500 ml-2">({comment.organization})</span>
                                                    )}
                                                </h3>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(comment.comment_date).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <div className="openai-badge openai-badge-blue">
                                                    {(comment.similarity_score * 100).toFixed(0)}% match
                                                </div>
                                                {explicitRefs.length > 0 && (
                                                    <div className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        {explicitRefs.length} reference{explicitRefs.length !== 1 ? 's' : ''}
                                                    </div>
                                                )}
                                                {exactMatches.length > 0 && (
                                                    <div className="px-2 py-1 bg-yellow-200 text-yellow-900 text-sm rounded flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        {exactMatches.length} exact match{exactMatches.length !== 1 ? 'es' : ''}
                                                    </div>
                                                )}
                                                {comment.has_attachments && (
                                                    <div className="openai-badge openai-badge-gray flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                        </svg>
                                                        {comment.attachment_count} attachment{comment.attachment_count !== 1 ? 's' : ''}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-gray-700 mb-4 openai-prose">
                                            <div dangerouslySetInnerHTML={{ __html: highlightedText.replace(/\n/g, '<br>') }} />
                                        </div>

                                        {comment.attachment_contents && comment.attachment_contents.length > 0 && (
                                            <AttachmentContent attachments={comment.attachment_contents} />
                                        )}

                                        <div className="flex justify-end mt-4">
                                            <Link
                                                href={proposalId ? `/comments/${comment.comment_id}?proposal=${proposalId}` : `/comments/${comment.comment_id}`}
                                                className="openai-button-secondary text-sm"
                                            >
                                                View full comment
                                            </Link>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}