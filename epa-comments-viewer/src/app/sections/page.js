import Link from 'next/link';

// This would be a server component that loads data
export default function SectionsPage() {
    // In a real implementation, this data would come from the loadCommentsData function
    const sections = [
        {
            key: 'vi-worker-safety',
            title: 'Section VI: Requests for Comment – Worker Safety and SOP',
            count: 8
        },
        {
            key: 'iv-b-2-puncturing-draining',
            title: 'Section IV.B.2: Proposed Requirements for Puncturing and Draining',
            count: 5
        },
        {
            key: 'i-background',
            title: 'Section I: Background',
            count: 6
        },
        // Additional sections would be listed here
    ];

    // Group sections by main section number
    const groupedSections = {};

    sections.forEach(section => {
        const mainSection = section.title.split(':')[0].trim();
        if (!groupedSections[mainSection]) {
            groupedSections[mainSection] = [];
        }
        groupedSections[mainSection].push(section);
    });

    return (
        <div className="space-y-8">
            <section className="text-center mb-8">
                <h1 className="text-4xl font-bold text-epa-blue mb-4">Regulatory Sections</h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Browse comments by EPA document section
                </p>
            </section>

            <div className="flex mb-6">
                <div className="relative w-full">
                    <input
                        type="text"
                        placeholder="Filter sections..."
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-epa-blue"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="space-y-10">
                {Object.entries(groupedSections).map(([mainSection, sectionList]) => (
                    <div key={mainSection} className="space-y-4">
                        <h2 className="text-2xl font-bold text-epa-blue border-b pb-2">{mainSection}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sectionList.map(section => (
                                <Link
                                    href={`/sections/${section.key}`}
                                    key={section.key}
                                    className="section-card flex justify-between items-center"
                                >
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg">{section.title}</h3>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="rounded-full bg-epa-blue text-white text-sm px-3 py-1">
                                            {section.count} comments
                                        </span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}