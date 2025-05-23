import Link from 'next/link';
import { fetchDocumentSections, fetchCommentSectionMatches, fetchComments } from '../../lib/supabase';
import DocumentStructure from '../../components/DocumentStructure';

export const dynamic = 'force-dynamic';

export default async function DocumentPage() {
    const sections = await fetchDocumentSections();
    const matches = await fetchCommentSectionMatches();
    const comments = await fetchComments();

    // Calculate the number of comments per section
    const commentCountBySection = matches.reduce((acc, match) => {
        acc[match.section_id] = (acc[match.section_id] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Calculate some statistics
    const totalSections = sections.length;
    const totalUniqueComments = comments.length;
    const totalMatches = matches.length;
    const sectionsWithComments = Object.keys(commentCountBySection).length;
    const averageMatchesPerComment = totalUniqueComments > 0
        ? (totalMatches / totalUniqueComments).toFixed(1)
        : '0';

    return (
        <div className="space-y-10">
            <div className="flex flex-col items-start">
                <Link
                    href="/"
                    className="text-sm text-gray-600 hover:text-gray-900 mb-8 flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to dashboard
                </Link>

                <h1 className="text-3xl font-semibold tracking-tight mb-4">Document Structure Analysis</h1>
                <p className="text-gray-600 mb-8 max-w-3xl">
                    This view shows the complete structure of the EPA document with AI-powered analysis of comment patterns.
                    Each section displays the number of comment matches it has received.
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
                <DocumentStructure sections={sections} commentCounts={commentCountBySection} />
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
                            On average, each comment is matched to {averageMatchesPerComment} different sections of the document.
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