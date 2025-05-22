export default function Home() {
    return (
        <div className="space-y-8">
            <section className="text-center mb-12">
                <h1 className="text-4xl font-bold text-epa-blue mb-4">EPA Aerosol Cans Regulation Comments</h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Explore public comments on the EPA's proposal for "Increasing Recycling: Adding Aerosol Cans to Universal Waste Regulations."
                </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="card">
                    <h2 className="text-2xl font-bold text-epa-blue mb-4">Overview</h2>
                    <div className="space-y-2">
                        <p className="flex justify-between">
                            <span>Total Comments:</span>
                            <span className="font-bold">80</span>
                        </p>
                        <p className="flex justify-between">
                            <span>Comments with Section References:</span>
                            <span className="font-bold">22</span>
                        </p>
                        <p className="flex justify-between">
                            <span>Total Sections Referenced:</span>
                            <span className="font-bold">85+</span>
                        </p>
                    </div>
                </div>

                <div className="card">
                    <h2 className="text-2xl font-bold text-epa-blue mb-4">Most Commented Sections</h2>
                    <ol className="list-decimal list-inside space-y-2">
                        <li className="flex justify-between">
                            <span>Worker Safety and SOP</span>
                            <span className="font-bold">8</span>
                        </li>
                        <li className="flex justify-between">
                            <span>Puncturing and Draining</span>
                            <span className="font-bold">5</span>
                        </li>
                        <li className="flex justify-between">
                            <span>Background</span>
                            <span className="font-bold">6</span>
                        </li>
                    </ol>
                </div>

                <div className="card">
                    <h2 className="text-2xl font-bold text-epa-blue mb-4">Quick Access</h2>
                    <div className="space-y-3">
                        <a href="/sections" className="btn-primary w-full block text-center">Browse All Sections</a>
                        <a href="/sections/vi-worker-safety" className="btn-secondary w-full block text-center">Worker Safety Comments</a>
                        <a href="/search" className="btn-secondary w-full block text-center">Search Comments</a>
                    </div>
                </div>
            </div>

            <section className="mt-12">
                <h2 className="text-2xl font-bold text-epa-blue mb-6">Recent Comments</h2>
                <div className="space-y-4">
                    {/* Sample comment cards - would be dynamically generated */}
                    <div className="comment-card">
                        <div className="flex justify-between mb-2">
                            <h3 className="font-bold">Anonymous public comment</h3>
                            <span className="text-gray-500">Apr 30, 2018</span>
                        </div>
                        <p className="text-gray-700 mb-2">
                            Note: I am a student at Duke University studying environmental science, and I'm writing this comment as an assignment for a class on environmental policy...
                        </p>
                        <div className="flex items-center text-sm text-gray-500">
                            <span className="mr-2">Referenced sections:</span>
                            <span className="bg-gray-200 rounded-full px-3 py-1 mr-2">Section I: Background</span>
                            <span className="bg-gray-200 rounded-full px-3 py-1">Section II: Proposed Addition</span>
                        </div>
                    </div>

                    <div className="comment-card">
                        <div className="flex justify-between mb-2">
                            <h3 className="font-bold">DLA Disposition Services</h3>
                            <span className="text-gray-500">Apr 17, 2018</span>
                        </div>
                        <p className="text-gray-700 mb-2">
                            I have a few questions: Does the proposed Rule includes Aerosol cans containing Reactive and Corrosive materials? or are these manage differently?...
                        </p>
                        <div className="flex items-center text-sm text-gray-500">
                            <span className="mr-2">Referenced sections:</span>
                            <span className="bg-gray-200 rounded-full px-3 py-1 mr-2">Section VI: Worker Safety</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}