import Link from 'next/link';
import { fetchSectionWithComments } from '../../../lib/supabase';
import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
    params
}: {
    params: { id: string }
}): Promise<Metadata> {
    const { section } = await fetchSectionWithComments(params.id);

    return {
        title: section ? `${section.section_number} ${section.section_title}` : 'Section Detail',
        description: section ? `View details and comment matches for section ${section.section_number}` : 'Section not found',
    };
}

export default async function SectionPage({
    params
}: {
    params: { id: string }
}) {
    const { section, comments } = await fetchSectionWithComments(params.id);

    if (!section) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Section Not Found</h2>
                <p className="text-gray-600 mb-6">The section you are looking for does not exist or has been removed.</p>
                <Link href="/document" className="openai-button">
                    Back to Document
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <div className="flex flex-col items-start">
                <Link
                    href="/document"
                    className="text-sm text-gray-600 hover:text-gray-900 mb-6 flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to document structure
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
                        <h2 className="text-lg font-medium mb-4">Section Content</h2>
                        <div className="openai-prose">
                            <ReactMarkdown>{section.section_text || 'No content available for this section.'}</ReactMarkdown>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="openai-card p-6">
                        <h2 className="text-lg font-medium mb-4">Match Statistics</h2>
                        <div className="space-y-4">
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Comment Matches</div>
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
                                        ? 'No comments have been matched to this section.'
                                        : `This section has ${comments.length} comment match${comments.length !== 1 ? 'es' : ''}, indicating ${comments.length > 10
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

                    <div className="openai-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium">AI Analysis</h2>
                            <div className="openai-badge openai-badge-gray">Beta</div>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            Our AI has analyzed the comments matched to this section and identified these key points:
                        </p>

                        {comments.length > 0 ? (
                            <ul className="space-y-2 text-sm text-gray-700">
                                <li className="flex items-start">
                                    <div className="h-4 w-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mt-1 mr-2">
                                        <span className="block h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                                    </div>
                                    <span>
                                        {comments.length > 5
                                            ? 'This section has received significant attention compared to others.'
                                            : 'This section has received a typical level of attention.'}
                                    </span>
                                </li>
                                <li className="flex items-start">
                                    <div className="h-4 w-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mt-1 mr-2">
                                        <span className="block h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                                    </div>
                                    <span>
                                        {comments.some(c => c.similarity_score > 0.8)
                                            ? 'Some comments show very high relevance to this section.'
                                            : 'Comments show moderate relevance to this section.'}
                                    </span>
                                </li>
                                <li className="flex items-start">
                                    <div className="h-4 w-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mt-1 mr-2">
                                        <span className="block h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                                    </div>
                                    <span>
                                        {comments.filter(c => c.has_attachments).length > 0
                                            ? `${comments.filter(c => c.has_attachments).length} matched comments include attachments with additional details.`
                                            : 'No matched comments include attachments.'}
                                    </span>
                                </li>
                            </ul>
                        ) : (
                            <div className="text-sm text-gray-500 italic">
                                No comments matched to this section for analysis.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {comments.length > 0 && (
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight mb-4">Matched Comments</h2>
                    <p className="text-gray-600 mb-6">
                        The following comments have been matched to this section based on content similarity. Each comment may be matched to multiple sections.
                    </p>

                    <div className="openai-card">
                        <ul className="divide-y divide-gray-100">
                            {comments.map(comment => (
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
                                        <ReactMarkdown>{comment.comment_text}</ReactMarkdown>
                                    </div>

                                    <div className="flex justify-end">
                                        <Link
                                            href={`/comments/${comment.comment_id}`}
                                            className="openai-button-secondary text-sm"
                                        >
                                            View full comment
                                        </Link>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}