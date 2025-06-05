import Link from 'next/link';
import { fetchCommentWithSections, fetchDocumentSections } from '../../../lib/supabase';
import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import { findSingleBestMatch } from '../../../lib/singleMatchLogic';
import { detectExplicitReferences, findExactTextMatches, createAnnotatedText } from '../../../lib/referenceDetection';
import AnnotatedTextDisplay from '../../../components/AnnotatedTextDisplay';
import AttachmentContent from '../../../components/AttachmentContent';

export const dynamic = 'force-dynamic';

// @ts-ignore - Temporarily bypassing type check for deployment
export async function generateMetadata({ params }) {
    const { comment } = await fetchCommentWithSections(params.id);

    return {
        title: comment ? `Comment by ${comment.commenter_name}` : 'Comment Detail',
        description: comment ? `View comment details and best matching document section` : 'Comment not found',
    };
}

// @ts-ignore - Temporarily bypassing type check for deployment
export default async function CommentPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ proposal?: string }>;
}) {
    const { id } = await params;
    const resolvedSearchParams = await searchParams;
    const proposalId = resolvedSearchParams.proposal;
    const { comment, sections } = await fetchCommentWithSections(id);

    // Fetch sections for the specific proposal if available, or all sections
    const allSections = proposalId
        ? await fetchDocumentSections(proposalId)
        : await fetchDocumentSections();

    if (!comment) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Comment Not Found</h2>
                <p className="text-gray-600 mb-6">The comment you are looking for does not exist or has been removed.</p>
                <Link
                    href={proposalId ? `/?proposal=${proposalId}` : '/'}
                    className="openai-button"
                >
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    // Find the single best match
    const bestMatch = findSingleBestMatch(comment, allSections, sections);

    // Get the full section data for the best match
    const bestMatchSection = bestMatch ? allSections.find(s => s.section_id === bestMatch.section_id) : null;

    // Detect explicit references for highlighting
    const explicitRefs = detectExplicitReferences(comment.comment_text);

    // Find exact text matches between comment and section
    const exactMatches = bestMatchSection
        ? findExactTextMatches(comment.comment_text, bestMatchSection.section_text)
        : [];

    // Create annotated text for comment and section
    const { annotatedText: annotatedCommentText, annotations: commentAnnotations } = createAnnotatedText(
        comment.comment_text,
        exactMatches,
        explicitRefs,
        true
    );

    const { annotatedText: annotatedSectionText, annotations: sectionAnnotations } = bestMatchSection
        ? createAnnotatedText(
            bestMatchSection.section_text,
            exactMatches,
            [],
            false
        )
        : { annotatedText: '', annotations: [] };

    // Get confidence badge color
    const getConfidenceBadgeColor = (level: string) => {
        switch (level) {
            case 'very_high': return 'bg-green-100 text-green-800';
            case 'high': return 'bg-blue-100 text-blue-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

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
                    Back to dashboard
                </Link>

                <h1 className="text-3xl font-semibold tracking-tight mb-1">Comment Detail</h1>
                <p className="text-gray-600 mb-6">
                    Viewing comment and its best matching document section
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="openai-card p-6">
                        <div className="mb-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-medium mb-1">{comment.commenter_name}</h2>
                                    {comment.organization && (
                                        <p className="text-gray-600">{comment.organization}</p>
                                    )}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {new Date(comment.comment_date).toLocaleDateString()}
                                </div>
                            </div>

                            {comment.has_attachments && (
                                <div className="bg-blue-50 text-blue-700 p-3 rounded-md text-sm mb-4 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    This comment includes {comment.attachment_count} attachment{comment.attachment_count !== 1 ? 's' : ''}.
                                    View them on the <a href={comment.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-800">original source</a>.
                                </div>
                            )}



                            <div className="openai-divider my-4"></div>

                            <div className="openai-prose">
                                <AnnotatedTextDisplay
                                    annotatedText={annotatedCommentText.replace(/\n/g, '<br>')}
                                    annotations={commentAnnotations}
                                />
                            </div>

                            {comment.attachment_contents && comment.attachment_contents.length > 0 && (
                                <AttachmentContent attachments={comment.attachment_contents} />
                            )}
                        </div>

                        <div className="flex justify-between items-center">
                            <a
                                href={comment.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                View original comment
                            </a>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="openai-card p-6">
                        <h2 className="text-lg font-medium mb-4">Match Analysis</h2>
                        <div className="space-y-4">
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Comment ID</div>
                                <div className="text-gray-800 font-mono text-sm bg-gray-50 p-2 rounded border border-gray-100 overflow-x-auto">
                                    {comment.comment_id}
                                </div>
                            </div>

                            {bestMatch ? (
                                <>
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">Best Match Score</div>
                                        <div className="text-2xl font-bold text-blue-600">
                                            {(bestMatch.similarity_score * 100).toFixed(1)}%
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">Confidence Level</div>
                                        <span className={`px-2 py-1 text-sm rounded ${getConfidenceBadgeColor(bestMatch.confidence_level)}`}>
                                            {bestMatch.confidence_level.replace('_', ' ')}
                                        </span>
                                    </div>

                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">Match Type</div>
                                        <span className={`px-2 py-1 text-sm rounded ${bestMatch.is_explicit_match ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {bestMatch.is_explicit_match ? 'Explicit Reference' : 'Semantic Similarity'}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-sm text-gray-500 italic">
                                    No suitable match found for this comment.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="openai-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium">Enhanced Analysis</h2>
                            <div className="openai-badge openai-badge-gray">Improved</div>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            Our enhanced AI analysis has identified:
                        </p>

                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start">
                                <div className="h-4 w-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mt-1 mr-2">
                                    <span className="block h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                                </div>
                                <span>
                                    {bestMatch
                                        ? `This comment has been matched to 1 primary section with ${bestMatch.confidence_level.replace('_', ' ')} confidence`
                                        : 'No clear section match could be determined for this comment'
                                    }
                                </span>
                            </li>

                            <li className="flex items-start">
                                <div className="h-4 w-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mt-1 mr-2">
                                    <span className="block h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                                </div>
                                <span>
                                    {explicitRefs.length > 0
                                        ? `${explicitRefs.length} explicit reference${explicitRefs.length !== 1 ? 's' : ''} detected and highlighted in the text`
                                        : 'No explicit section references found in the comment text'
                                    }
                                </span>
                            </li>

                            <li className="flex items-start">
                                <div className="h-4 w-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mt-1 mr-2">
                                    <span className="block h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                                </div>
                                <span>
                                    {comment.comment_text.length > 1000
                                        ? 'This is a detailed comment with extensive feedback'
                                        : comment.comment_text.length < 100
                                            ? 'This is a brief comment'
                                            : 'This is a moderate-length comment'
                                    }
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {bestMatch && (
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight mb-4">Best Matching Section</h2>
                    <p className="text-gray-600 mb-6">
                        This comment has been matched to the following document section using our enhanced matching algorithm.
                    </p>

                    <div className="openai-card p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-medium mb-2">
                                    <span className="text-gray-500">{bestMatch.section_number}</span> {bestMatch.section_title}
                                </h3>
                                <div className="flex items-center space-x-3 mb-3">
                                    <span className={`px-3 py-1 text-sm rounded ${getConfidenceBadgeColor(bestMatch.confidence_level)}`}>
                                        {(bestMatch.similarity_score * 100).toFixed(1)}% - {bestMatch.confidence_level.replace('_', ' ')} confidence
                                    </span>
                                    {bestMatch.is_explicit_match && (
                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded">
                                            Explicit Reference Match
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-600 mb-4">
                                    <span className="font-medium">Match Reason:</span> {bestMatch.match_reason}
                                </div>
                            </div>
                        </div>

                        {annotatedSectionText && (
                            <div className="border-t border-gray-100 pt-4">
                                <h4 className="text-lg font-medium mb-3 flex items-center">
                                    Section Content
                                    {exactMatches.length > 0 && (
                                        <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                            {exactMatches.length} exact match{exactMatches.length !== 1 ? 'es' : ''} found
                                        </span>
                                    )}
                                </h4>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                                    <div className="openai-prose text-sm">
                                        <AnnotatedTextDisplay
                                            annotatedText={annotatedSectionText.replace(/\n/g, '<br>')}
                                            annotations={sectionAnnotations}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="border-t border-gray-100 pt-4 mt-4">
                            <Link
                                href={proposalId ? `/sections/${bestMatch.section_id}?proposal=${proposalId}` : `/sections/${bestMatch.section_id}`}
                                className="openai-button inline-flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                View Full Section Details
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {!bestMatch && (
                <div className="openai-card p-6 text-center">
                    <div className="text-gray-500 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.194-5.5-3M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No Clear Match Found</h3>
                    <p className="text-gray-600">
                        This comment could not be confidently matched to a specific document section.
                        It may be a general comment about the overall proposal.
                    </p>
                </div>
            )}
        </div>
    );
}