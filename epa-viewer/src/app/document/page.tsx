import Link from 'next/link';
import { fetchDocumentSections, fetchCommentSectionMatches, fetchComments, fetchProposal } from '../../lib/supabase';
import { findSingleBestMatch } from '../../lib/singleMatchLogic';
import DocumentStructure from '../../components/DocumentStructure';

export const dynamic = 'force-dynamic';

interface DocumentPageProps {
    searchParams: Promise<{ proposal?: string }>;
}

export default async function DocumentPage({ searchParams }: DocumentPageProps) {
    const resolvedSearchParams = await searchParams;
    const proposalId = resolvedSearchParams.proposal;

    if (!proposalId) {
        return (
            <div className="space-y-10">
                <div className="text-center py-20">
                    <h2 className="text-xl text-gray-600">No proposal selected</h2>
                    <p className="text-gray-500 mt-2">Please select a proposal from the dropdown above.</p>
                    <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
                        ← Return to dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const [sections, rawMatches, comments, proposal] = await Promise.all([
        fetchDocumentSections(proposalId),
        fetchCommentSectionMatches(proposalId),
        fetchComments(proposalId),
        fetchProposal(proposalId)
    ]);

    if (!proposal) {
        return (
            <div className="space-y-10">
                <div className="text-center py-20">
                    <h2 className="text-xl text-gray-600">Proposal not found</h2>
                    <p className="text-gray-500 mt-2">The selected proposal could not be found.</p>
                    <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
                        ← Return to dashboard
                    </Link>
                </div>
            </div>
        );
    }

    // Apply single best match logic to each comment
    const singleBestMatches = comments
        .map(comment => {
            // Get all matches for this comment
            const commentMatches = rawMatches.filter(match => match.comment_id === comment.comment_id);

            // Convert to the format expected by findSingleBestMatch
            const sectionsWithScores = commentMatches.map(match => {
                const section = sections.find(s => s.section_id === match.section_id);
                return section ? {
                    ...section,
                    similarity_score: match.similarity_score,
                    match_rank: match.match_rank
                } : null;
            }).filter(Boolean);

            // Find the single best match
            const bestMatch = findSingleBestMatch(comment, sections, sectionsWithScores);

            return bestMatch ? {
                comment_id: comment.comment_id,
                section_id: bestMatch.section_id,
                similarity_score: bestMatch.similarity_score
            } : null;
        })
        .filter(Boolean);

    // Calculate the number of comments per section using single best matches
    const commentCountBySection = singleBestMatches.reduce((acc, match) => {
        acc[match.section_id] = (acc[match.section_id] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Calculate some statistics
    const totalSections = sections.length;
    const totalUniqueComments = comments.length;
    const totalMatches = singleBestMatches.length;
    const sectionsWithComments = Object.keys(commentCountBySection).length;
    const averageMatchesPerComment = totalUniqueComments > 0
        ? (totalMatches / totalUniqueComments).toFixed(1)
        : '0';

    return (
        <div className="space-y-10">
            <div className="flex flex-col items-start">
                <Link
                    href={`/?proposal=${proposalId}`}
                    className="text-sm text-gray-600 hover:text-gray-900 mb-8 flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to dashboard
                </Link>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 w-full">
                    <h2 className="font-semibold text-blue-900">{proposal.docket_id}</h2>
                    <p className="text-blue-800 text-sm">{proposal.title}</p>
                    {proposal.description && (
                        <p className="text-blue-700 text-xs mt-1">{proposal.description}</p>
                    )}
                </div>

                <h1 className="text-3xl font-semibold tracking-tight mb-4">Document Structure Analysis</h1>
                <p className="text-gray-600 mb-8 max-w-3xl">
                    This view shows the complete structure of the EPA document with enhanced AI-powered analysis.
                    Each section displays the number of comments that have been matched to it as their primary section.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="openai-card p-6 flex flex-col items-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{totalSections}</div>
                    <div className="text-sm text-gray-600 text-center">Total Sections</div>
                </div>

                <div className="openai-card p-6 flex flex-col items-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{sectionsWithComments}</div>
                    <div className="text-sm text-gray-600 text-center">Sections w/ Matches</div>
                </div>

                <div className="openai-card p-6 flex flex-col items-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{totalUniqueComments}</div>
                    <div className="text-sm text-gray-600 text-center">Unique Comments</div>
                </div>

                <div className="openai-card p-6 flex flex-col items-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{totalMatches}</div>
                    <div className="text-sm text-gray-600 text-center">Total Matches</div>
                </div>
            </div>

            <div className="mt-10">
                <DocumentStructure sections={sections} commentCounts={commentCountBySection} proposalId={proposalId} />
            </div>

            <div className="openai-card p-8 mt-10">
                <div className="flex items-center mb-6">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg openai-gradient mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold">AI-Powered Document Analysis</h2>
                </div>

                <p className="text-gray-600 mb-4">
                    Our AI has analyzed how comments match to different document sections and identified patterns:
                </p>

                <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mt-0.5 mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span className="text-gray-700">
                            {sectionsWithComments > 0 ?
                                `${Math.round((sectionsWithComments / totalSections) * 100)}% of document sections have received at least one comment match.` :
                                'No sections have received comment matches yet.'}
                        </span>
                    </li>
                    <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mt-0.5 mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span className="text-gray-700">
                            Each comment is matched to exactly {averageMatchesPerComment} section (its single best match) for precise categorization.
                        </span>
                    </li>
                    <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mt-0.5 mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span className="text-gray-700">
                            Comments are distributed across multiple hierarchy levels, suggesting comprehensive public review.
                        </span>
                    </li>
                </ul>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-600 italic">
                        "Understanding which sections receive the most attention can help prioritize regulatory revisions and identify areas of public concern."
                    </p>
                </div>
            </div>
        </div>
    );
}