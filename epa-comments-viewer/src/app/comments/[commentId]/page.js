import Link from 'next/link';

// This would be a server component that loads the comment data
export default function CommentPage({ params }) {
    const { commentId } = params;

    // In a real implementation, this data would come from the getCommentById function
    const comment = {
        comment_id: 'EPA-HQ-OLEM-2017-0463-0027',
        commenter_name: 'DLA Disposition Services',
        organization: 'DLA Disposition Services',
        comment_date: 'Apr 17, 2018',
        comment_text: 'I have a few questions:\n\nDoes the proposed Rule includes Aerosol cans containing Reactive and Corrosive materials?\n\nor are these manage differently?\n\nhow about those aerosol cans containing, fungicides, herbicides and pesticides?\n\nwill they be manage as UW, also?\n\nthanks,',
        attachments: [],
        sections: [
            'Section VI: Requests for Comment – Worker Safety and SOP',
            'Section IV.B.2: Proposed Requirements for Puncturing and Draining'
        ]
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center mb-8">
                <Link href="/sections" className="text-epa-blue hover:underline flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Sections
                </Link>

                <a
                    href={`https://www.regulations.gov/comment/${comment.comment_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:underline text-sm flex items-center"
                >
                    View on regulations.gov
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </a>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-epa-blue mb-2">Comment {comment.comment_id}</h1>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center text-gray-600">
                        <div className="mb-2 md:mb-0">
                            <p className="font-semibold">{comment.commenter_name}</p>
                            <p>{comment.organization}</p>
                        </div>
                        <p>{comment.comment_date}</p>
                    </div>
                </div>

                <div className="border-t border-b py-6 my-6">
                    <h2 className="text-xl font-semibold mb-4">Comment Text</h2>
                    <div className="whitespace-pre-line text-gray-700">
                        {comment.comment_text}
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Referenced Sections</h2>
                    <div className="space-y-2">
                        {comment.sections.map(section => (
                            <Link
                                key={section}
                                href={`/sections/${section.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                                className="block bg-gray-100 hover:bg-gray-200 rounded-md p-3 transition-colors"
                            >
                                {section}
                            </Link>
                        ))}
                    </div>
                </div>

                {comment.attachments && comment.attachments.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Attachments</h2>
                        <ul className="list-disc list-inside space-y-2">
                            {comment.attachments.map((attachment, index) => (
                                <li key={index} className="text-epa-blue hover:underline">
                                    <a href="#">{attachment.filename || `Attachment ${index + 1}`}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Related Comments</h2>
                <p className="text-gray-600 italic">
                    Comments that reference the same sections
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="border rounded-md p-4 hover:shadow-md transition-shadow">
                            <p className="font-semibold">Anonymous public comment</p>
                            <p className="text-gray-500 text-sm mb-2">Apr 30, 2018</p>
                            <p className="text-gray-700 text-sm truncate">
                                Note: I am a student at Duke University studying environmental science...
                            </p>
                            <Link
                                href={`/comments/EPA-HQ-OLEM-2017-0463-00${30 + i}`}
                                className="text-epa-blue text-sm hover:underline mt-2 inline-block"
                            >
                                Read comment
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}