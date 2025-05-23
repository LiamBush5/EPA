import Link from 'next/link';
import { fetchDocumentSections, fetchCommentSectionMatches } from '../lib/supabase';
import DocumentStructure from '../components/DocumentStructure';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const sections = await fetchDocumentSections();
  const matches = await fetchCommentSectionMatches();

  // Calculate the number of comments per section
  const commentCountBySection = matches.reduce((acc, match) => {
    acc[match.section_id] = (acc[match.section_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Find top sections by comment count
  const topSections = [...sections]
    .map(section => ({
      ...section,
      commentCount: commentCountBySection[section.section_id] || 0
    }))
    .sort((a, b) => b.commentCount - a.commentCount)
    .slice(0, 5);

  // Calculate statistics
  const totalComments = matches.length;
  const sectionsWithComments = Object.keys(commentCountBySection).length;
  const averageCommentsPerSection = sectionsWithComments > 0
    ? (totalComments / sectionsWithComments).toFixed(1)
    : '0';

  return (
    <div className="space-y-16">
      {/* Hero section */}
      <section className="text-center -mt-8 mb-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-semibold mb-4 tracking-tight">
            EPA Document Analysis with AI
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Identify patterns, analyze feedback, and understand public comments on EPA documents
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/document" className="openai-button">
              Explore Document Structure
            </Link>
            <button className="openai-button-secondary">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Stats section */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="openai-card p-6 text-center">
            <h3 className="text-3xl font-bold text-blue-600 mb-2">{sections.length}</h3>
            <p className="text-gray-600">Total Sections</p>
          </div>

          <div className="openai-card p-6 text-center">
            <h3 className="text-3xl font-bold text-blue-600 mb-2">{sectionsWithComments}</h3>
            <p className="text-gray-600">Sections with Comments</p>
          </div>

          <div className="openai-card p-6 text-center">
            <h3 className="text-3xl font-bold text-blue-600 mb-2">{totalComments}</h3>
            <p className="text-gray-600">Total Comments</p>
          </div>

          <div className="openai-card p-6 text-center">
            <h3 className="text-3xl font-bold text-blue-600 mb-2">{averageCommentsPerSection}</h3>
            <p className="text-gray-600">Avg. Comments per Section</p>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="openai-card p-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg openai-gradient mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-3">Document Analysis</h3>
          <p className="text-gray-600 mb-5">
            Explore how EPA regulatory documents are structured and which sections receive the most attention from the public.
          </p>
          <Link href="/document" className="text-blue-600 font-medium hover:underline">
            View Document Structure →
          </Link>
        </div>

        <div className="openai-card p-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg openai-gradient mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-3">Comment Analysis</h3>
          <p className="text-gray-600 mb-5">
            AI-powered analysis of public comments reveals patterns, concerns, and sentiment across different sections of regulatory documents.
          </p>
          <Link href={`/sections/${topSections[0]?.section_id || ''}`} className="text-blue-600 font-medium hover:underline">
            Explore Top Comments →
          </Link>
        </div>
      </section>

      {/* Top commented sections */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">Most Commented Sections</h2>
          <Link href="/document" className="text-blue-600 font-medium hover:underline text-sm">
            View All Sections →
          </Link>
        </div>

        <div className="openai-card">
          <ul className="divide-y divide-gray-100">
            {topSections.map(section => (
              <li key={section.section_id} className="p-6 hover:bg-gray-50 transition-colors">
                <Link href={`/sections/${section.section_id}`} className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">
                      <span className="text-gray-500">{section.section_number}</span> {section.section_title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">{section.section_text}</p>
                  </div>
                  <div className="openai-badge openai-badge-blue ml-4 flex items-center whitespace-nowrap">
                    {section.commentCount} comment{section.commentCount !== 1 ? 's' : ''}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
