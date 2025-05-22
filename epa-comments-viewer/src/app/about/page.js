export default function AboutPage() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <section className="text-center mb-10">
                <h1 className="text-4xl font-bold text-epa-blue mb-4">About This Project</h1>
                <p className="text-xl text-gray-600">
                    Understanding and visualizing public comments on the EPA's aerosol cans regulation
                </p>
            </section>

            <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-epa-blue mb-4">Project Overview</h2>
                <p className="text-gray-700 mb-4">
                    This viewer tool was developed to help analyze and organize public comments submitted to the EPA regarding the
                    proposed rule "Increasing Recycling: Adding Aerosol Cans to Universal Waste Regulations."
                </p>
                <p className="text-gray-700 mb-4">
                    The EPA received 80 public comments on this proposal. This tool helps identify which comments
                    addressed specific sections of the proposed regulation, allowing for easier review and analysis.
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-epa-blue mb-4">Methodology</h2>
                <p className="text-gray-700 mb-4">
                    The analysis process involved:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
                    <li>Scraping all public comments from the regulations.gov website</li>
                    <li>Processing and cleaning the comment text</li>
                    <li>Using AI to analyze which specific sections each comment addressed</li>
                    <li>Organizing comments by regulatory section for easier review</li>
                </ol>
                <p className="text-gray-700">
                    The AI analysis identified 22 comments that specifically addressed sections of the proposal,
                    while 58 comments did not specify particular sections.
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-epa-blue mb-4">Key Findings</h2>
                <p className="text-gray-700 mb-4">
                    The analysis revealed several patterns in public feedback:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Section VI: Requests for Comment – Worker Safety and SOP received the most comments (8)</li>
                    <li>Section IV.B.2: Proposed Requirements for Puncturing and Draining was the second most commented section (5)</li>
                    <li>Many commenters were students submitting comments as part of course assignments</li>
                    <li>Several industrial stakeholders submitted detailed technical comments on specific provisions</li>
                </ul>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-epa-blue mb-4">Tools Used</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Next.js and React for the web interface</li>
                    <li>Tailwind CSS for styling</li>
                    <li>Python for data processing and analysis</li>
                    <li>OpenAI API for comment analysis</li>
                    <li>Chart.js for data visualization</li>
                </ul>
            </div>

            <div className="bg-gray-100 rounded-lg p-6 text-center">
                <p className="text-gray-700">
                    This project was developed to help the EPA better understand public feedback on their proposed regulation.
                </p>
            </div>
        </div>
    );
}
