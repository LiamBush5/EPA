import Link from 'next/link';

export default function SearchPage() {
    const searchResults = []; // In a real app, this would be populated from the search query

    return (
        <div className="space-y-8">
            <section className="text-center mb-8">
                <h1 className="text-4xl font-bold text-epa-blue mb-4">Search Comments</h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Search for comments by keyword, commenter name, organization, or section
                </p>
            </section>

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search comments..."
                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-epa-blue"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <button className="btn-primary md:w-auto w-full">Search</button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <h3 className="text-sm text-gray-500 w-full">Filter by:</h3>
                    <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm">Sections</button>
                    <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm">Organizations</button>
                    <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm">Date Range</button>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-epa-blue border-b pb-2">
                    {searchResults.length > 0
                        ? `${searchResults.length} Results Found`
                        : 'Example Search Results'}
                </h2>

                {/* Placeholder results for design */}
                <div className="comment-card">
                    <div className="flex justify-between mb-3">
                        <div>
                            <h3 className="font-bold text-lg">DLA Disposition Services</h3>
                            <p className="text-gray-600">DLA Disposition Services</p>
                        </div>
                        <span className="text-gray-500">Apr 17, 2018</span>
                    </div>

                    <p className="text-gray-700 mb-4">
                        I have a few questions: Does the proposed Rule includes <mark className="bg-yellow-200">Aerosol cans</mark> containing Reactive and Corrosive materials? or are these manage differently? how about those <mark className="bg-yellow-200">aerosol cans</mark> containing, fungicides, herbicides and pesticides? will they be manage as UW, also?
                    </p>

                    <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center text-sm text-gray-500">
                            <span className="mr-2">Referenced sections:</span>
                            <span className="bg-gray-200 rounded-full px-3 py-1 mr-2">Worker Safety</span>
                            <span className="bg-gray-200 rounded-full px-3 py-1">Puncturing and Draining</span>
                        </div>

                        <Link
                            href={`/comments/EPA-HQ-OLEM-2017-0463-0027`}
                            className="text-epa-blue hover:underline text-sm"
                        >
                            View comment
                        </Link>
                    </div>
                </div>

                <div className="comment-card">
                    <div className="flex justify-between mb-3">
                        <div>
                            <h3 className="font-bold text-lg">Anonymous public comment</h3>
                            <p className="text-gray-600">Environmental Protection Agency</p>
                        </div>
                        <span className="text-gray-500">Apr 30, 2018</span>
                    </div>

                    <p className="text-gray-700 mb-4">
                        The use and disposal of <mark className="bg-yellow-200">aerosol cans</mark> poses numerous health and safety risks to workers and the public due to their flammability, pressurized contents, and toxic materials. They are also demonstrably harmful to public health and the environment due to their effects on the atmosphere...
                    </p>

                    <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center text-sm text-gray-500">
                            <span className="mr-2">Referenced sections:</span>
                            <span className="bg-gray-200 rounded-full px-3 py-1 mr-2">Background</span>
                            <span className="bg-gray-200 rounded-full px-3 py-1">Summary of Proposed Rule</span>
                        </div>

                        <Link
                            href={`/comments/EPA-HQ-OLEM-2017-0463-0034`}
                            className="text-epa-blue hover:underline text-sm"
                        >
                            View comment
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}