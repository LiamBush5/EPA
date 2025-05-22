import Link from 'next/link';

// This would be a server component that loads the section data
export default function SectionPage({ params }) {
    const { sectionKey } = params;

    // In a real implementation, this data would come from the getSectionData function
    const section = {
        key: 'vi-worker-safety',
        title: 'Section VI: Requests for Comment – Worker Safety and SOP',
        comments: [
            {
                comment_id: 'EPA-HQ-OLEM-2017-0463-0027',
                commenter_name: 'DLA Disposition Services',
                organization: 'DLA Disposition Services',
                comment_date: 'Apr 17, 2018',
                comment_text: 'I have a few questions: Does the proposed Rule includes Aerosol cans containing Reactive and Corrosive materials? or are these manage differently? how about those aerosol cans containing, fungicides, herbicides and pesticides? will they be manage as UW, also?'
            },
            {
                comment_id: 'EPA-HQ-OLEM-2017-0463-0034',
                commenter_name: 'Anonymous public comment',
                organization: 'Environmental Protection Agency',
                comment_date: 'Apr 30, 2018',
                comment_text: 'Note: I am a student at Duke University studying environmental science, and I\'m writing this comment as an assignment for a class on environmental policy. The use and disposal of aerosol cans poses numerous health and safety risks to workers and the public due to their flammability, pressurized contents, and toxic materials.'
            },
            // More comments would be here
        ]
    };

    // For the demo, ensure the mock data matches the requested section
    const sectionTitle = {
        'vi-worker-safety': 'Section VI: Requests for Comment – Worker Safety and SOP',
        'iv-b-2-puncturing-draining': 'Section IV.B.2: Proposed Requirements for Puncturing and Draining',
        'i-background': 'Section I: Background'
    }[sectionKey] || 'Unknown Section';

    return (
        <div className="space-y-8">
            <div className="flex items-center mb-8">
                <Link href="/sections" className="text-epa-blue hover:underline flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Sections
                </Link>
            </div>

            <section className="mb-8">
                <h1 className="text-3xl font-bold text-epa-blue mb-2">{sectionTitle}</h1>
                <p className="text-xl text-gray-600">
                    {section.comments.length} comments address this section
                </p>
            </section>

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-epa-blue">Comments</h2>
                    <div className="flex space-x-2">
                        <select className="border rounded-md px-3 py-1">
                            <option>Sort by Date</option>
                            <option>Sort by Organization</option>
                            <option>Sort Alphabetically</option>
                        </select>
                        <button className="btn-secondary">Filter</button>
                    </div>
                </div>

                {section.comments.map(comment => (
                    <div key={comment.comment_id} className="comment-card">
                        <div className="flex justify-between mb-3">
                            <div>
                                <h3 className="font-bold text-lg">{comment.commenter_name}</h3>
                                <p className="text-gray-600">{comment.organization}</p>
                            </div>
                            <span className="text-gray-500">{comment.comment_date}</span>
                        </div>

                        <p className="text-gray-700 mb-4">
                            {comment.comment_text.length > 300
                                ? `${comment.comment_text.substring(0, 300)}...`
                                : comment.comment_text}
                        </p>

                        <div className="flex justify-between items-center">
                            <Link
                                href={`/comments/${comment.comment_id}`}
                                className="text-epa-blue hover:underline"
                            >
                                Read full comment
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
                    </div>
                ))}
            </div>
        </div>
    );
}