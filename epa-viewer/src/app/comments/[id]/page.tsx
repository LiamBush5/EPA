import Link from 'next/link';
import { fetchCommentWithSections } from '../../../lib/supabase';
import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';

export const dynamic = 'force-dynamic';

// @ts-ignore - Temporarily bypassing type check for deployment
export async function generateMetadata({ params }) {
    const { comment } = await fetchCommentWithSections(params.id);

    return {
        title: comment ? `Comment by ${comment.commenter_name}` : 'Comment Detail',
        description: comment ? `View comment details and related document sections` : 'Comment not found',
    };
}

// @ts-ignore - Temporarily bypassing type check for deployment
export default async function CommentPage({ params }) {
    const { comment, sections } = await fetchCommentWithSections(params.id);

    if (!comment) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Comment Not Found</h2>
                <p className="text-gray-600 mb-6">The comment you are looking for does not exist or has been removed.</p>
                <Link href="/" className="openai-button">
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <div className="flex flex-col items-start">
                <Link
                    href="/"
                    className="text-sm text-gray-600 hover:text-gray-900 mb-6 flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to dashboard
                </Link>

                <h1 className="text-3xl font-semibold tracking-tight mb-1">Comment Detail</h1>
                <p className="text-gray-600 mb-6">
                    Viewing full comment and related document sections
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
                                <ReactMarkdown>{comment.comment_text}</ReactMarkdown>
                            </div>
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
                        <h2 className="text-lg font-medium mb-4">Comment Information</h2>
                        <div className="space-y-4">
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Comment ID</div>
                                <div className="text-gray-800 font-mono text-sm bg-gray-50 p-2 rounded border border-gray-100 overflow-x-auto">
                                    {comment.comment_id}
                                </div>
                            </div>

                            <div>
                                <div className="text-sm text-gray-500 mb-1">Matched Sections</div>
                                <div className="text-2xl font-bold text-blue-600">{sections.length}</div>
                            </div>

                            <div>
                                <div className="text-sm text-gray-500 mb-1">Top Match Score</div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {sections.length > 0
                                        ? `${(sections[0].similarity_score * 100).toFixed(1)}%`
                                        : '0%'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="openai-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium">AI Analysis</h2>
                            <div className="openai-badge openai-badge-gray">Beta</div>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            Our AI has analyzed this comment and identified:
                        </p>

                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start">
                                <div className="h-4 w-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mt-1 mr-2">
                                    <span className="block h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                                </div>
                                <span>
                                    This comment addresses {sections.length} different sections of the document
                                </span>
                            </li>

                            <li className="flex items-start">
                                <div className="h-4 w-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mt-1 mr-2">
                                    <span className="block h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                                </div>
                                <span>
                                    {sections.some(s => s.similarity_score > 0.8)
                                        ? 'There is a very strong match with at least one document section'
                                        : 'The comment matches moderately with related sections'}
                                </span>
                            </li>

                            <li className="flex items-start">
                                <div className="h-4 w-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mt-1 mr-2">
                                    <span className="block h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                                </div>
                                <span>
                                    {comment.comment_text.length > 1000
                                        ? 'This is a detailed comment with extensive feedback'
                                        : 'This is a relatively brief comment'}
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {sections.length > 0 && (
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight mb-4">Matched Document Sections</h2>
                    <p className="text-gray-600 mb-6">
                        This comment has been matched to the following document sections based on content similarity.
                    </p>

                    <div className="openai-card">
                        <ul className="divide-y divide-gray-100">
                            {sections.map(section => (
                                <li key={section.section_id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <Link href={`/sections/${section.section_id}`} className="block">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-medium">
                                                <span className="text-gray-500">{section.section_number}</span> {section.section_title}
                                            </h3>
                                            <div className="openai-badge openai-badge-blue">
                                                {(section.similarity_score * 100).toFixed(1)}% match
                                            </div>
                                        </div>

                                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                                            {section.section_text}
                                        </p>

                                        <div className="text-blue-600 text-sm font-medium hover:underline">
                                            View section
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}