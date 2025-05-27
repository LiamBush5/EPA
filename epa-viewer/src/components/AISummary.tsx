'use client';

import { useState, useEffect } from 'react';
import { CommentSummary } from '../lib/openai';

interface AISummaryProps {
    sectionId: string;
    sectionTitle: string;
    sectionNumber: string;
    commentCount: number;
}

export default function AISummary({ sectionId, sectionTitle, sectionNumber, commentCount }: AISummaryProps) {
    const [summary, setSummary] = useState<CommentSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    const generateSummary = async () => {
        if (commentCount === 0) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/ai-summary/${sectionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sectionTitle,
                    sectionNumber,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate summary');
            }

            const data = await response.json();
            setSummary(data.summary);
            setExpanded(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case 'positive': return 'bg-green-100 text-green-800';
            case 'negative': return 'bg-red-100 text-red-800';
            case 'mixed': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getSentimentIcon = (sentiment: string) => {
        switch (sentiment) {
            case 'positive':
                return (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'negative':
                return (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'mixed':
                return (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                );
        }
    };

    if (commentCount === 0) {
        return (
            <div className="openai-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium">AI Comment Summary</h2>
                    <div className="openai-badge openai-badge-gray">No Comments</div>
                </div>
                <p className="text-sm text-gray-500 italic">
                    No comments available for AI analysis.
                </p>
            </div>
        );
    }

    return (
        <div className="openai-card p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">AI Comment Summary</h2>
                <div className="flex items-center space-x-2">
                    <div className="openai-badge openai-badge-blue">
                        {commentCount} comment{commentCount !== 1 ? 's' : ''}
                    </div>
                    {summary && (
                        <span className={`px-2 py-1 text-xs rounded flex items-center ${getSentimentColor(summary.sentiment)}`}>
                            {getSentimentIcon(summary.sentiment)}
                            <span className="ml-1 capitalize">{summary.sentiment}</span>
                        </span>
                    )}
                </div>
            </div>

            {!summary && !loading && (
                <div className="text-center py-4">
                    <p className="text-sm text-gray-600 mb-4">
                        Generate an AI-powered summary of what commenters are saying about this section.
                    </p>
                    <button
                        onClick={generateSummary}
                        className="openai-button"
                    >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Generate AI Summary
                    </button>
                </div>
            )}

            {loading && (
                <div className="text-center py-8">
                    <div className="inline-flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm text-gray-600">Analyzing comments with AI...</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                        <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error generating summary</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                            <button
                                onClick={generateSummary}
                                className="text-sm text-red-800 underline hover:text-red-900 mt-2"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {summary && (
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <h3 className="text-sm font-medium text-blue-900 mb-2">Summary</h3>
                        <p className="text-sm text-blue-800">{summary.summary}</p>
                    </div>

                    {expanded && (
                        <div className="space-y-4">
                            {summary.mainThemes.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">Main Themes</h3>
                                    <ul className="space-y-1">
                                        {summary.mainThemes.map((theme, index) => (
                                            <li key={index} className="text-sm text-gray-700 flex items-start">
                                                <span className="h-1.5 w-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                                {theme}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {summary.keyPoints.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">Key Points</h3>
                                    <ul className="space-y-1">
                                        {summary.keyPoints.map((point, index) => (
                                            <li key={index} className="text-sm text-gray-700 flex items-start">
                                                <span className="h-1.5 w-1.5 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {summary.concerns.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">Main Concerns</h3>
                                    <ul className="space-y-1">
                                        {summary.concerns.map((concern, index) => (
                                            <li key={index} className="text-sm text-gray-700 flex items-start">
                                                <span className="h-1.5 w-1.5 bg-red-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                                {concern}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {summary.suggestions.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">Suggestions</h3>
                                    <ul className="space-y-1">
                                        {summary.suggestions.map((suggestion, index) => (
                                            <li key={index} className="text-sm text-gray-700 flex items-start">
                                                <span className="h-1.5 w-1.5 bg-yellow-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                                {suggestion}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            {expanded ? 'Show less' : 'Show detailed analysis'}
                        </button>
                        <button
                            onClick={generateSummary}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Regenerate
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}