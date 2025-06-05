'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useProposal } from './ProposalProvider';
import {
    fetchDocumentSections,
    fetchComments,
    DocumentSection,
    Comment
} from '../lib/supabase';

export default function ProposalAwarePage() {
    const { selectedProposalId, selectedProposal, isLoading } = useProposal();
    const [sections, setSections] = useState<DocumentSection[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!selectedProposalId) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const [sectionsData, commentsData] = await Promise.all([
                    fetchDocumentSections(selectedProposalId),
                    fetchComments(selectedProposalId)
                ]);

                setSections(sectionsData);
                setComments(commentsData);
            } catch (error) {
                console.error('Error loading proposal data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [selectedProposalId]);

    if (loading || isLoading) {
        return (
            <div className="space-y-16">
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (!selectedProposal) {
        return (
            <div className="space-y-16">
                <div className="text-center py-20">
                    <h2 className="text-xl text-gray-600">No proposal selected</h2>
                    <p className="text-gray-500 mt-2">Please select a proposal from the dropdown above.</p>
                </div>
            </div>
        );
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Not specified';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return 'Invalid date';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return 'bg-green-100 text-green-700 border-green-200';
            case 'closed': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'draft': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    const getOfficeInfo = (proposal: any) => {
        if (proposal.metadata?.office) {
            return {
                office: proposal.metadata.office,
                office_code: proposal.metadata.office_code || ''
            };
        }
        const docketParts = proposal.docket_id.split('-');
        if (docketParts.length >= 3) {
            const code = docketParts[2];
            const officeMap: Record<string, string> = {
                'OAR': 'Office of Air and Radiation',
                'OLEM': 'Office of Land and Emergency Management',
                'OW': 'Office of Water',
                'OCSPP': 'Office of Chemical Safety and Pollution Prevention'
            };
            return {
                office: officeMap[code] || `Office of ${code}`,
                office_code: code
            };
        }
        return { office: 'Environmental Protection Agency', office_code: 'EPA' };
    };

    const officeInfo = getOfficeInfo(selectedProposal);

    return (
        <div className="space-y-8">
            {/* Hero Section with Integrated Proposal Details */}
            <section className="relative overflow-hidden">
                <div className="bg-white rounded-2xl border border-gray-200/60 shadow-lg">
                    {/* Main Header */}
                    <div className="relative p-8 pb-6">
                        <div className="relative">
                            {/* Status and Docket Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                        <span className="text-lg font-semibold text-gray-900">
                                            {selectedProposal.docket_id}
                                        </span>
                                    </div>
                                    <span className={`px-4 py-1.5 text-sm font-medium rounded-full border ${getStatusColor(selectedProposal.status)}`}>
                                        {selectedProposal.status.charAt(0).toUpperCase() + selectedProposal.status.slice(1)}
                                    </span>
                                </div>

                                {selectedProposal.source_url && (
                                    <a
                                        href={selectedProposal.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-xl border border-gray-200 hover:bg-gray-100 hover:shadow-md transition-all duration-200"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        View on Regulations.gov
                                    </a>
                                )}
                            </div>

                            {/* Title and Description */}
                            <div className="mb-8">
                                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
                                    {selectedProposal.title.trim()}
                                </h1>
                                {selectedProposal.description && (
                                    <p className="text-xl text-gray-700 leading-relaxed max-w-4xl">
                                        {selectedProposal.description}
                                    </p>
                                )}
                            </div>

                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                    <div className="text-2xl font-bold text-blue-600 mb-1">
                                        {comments.length.toLocaleString()}
                                    </div>
                                    <div className="text-sm font-medium text-gray-600">Public Comments</div>
                                </div>
                                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                    <div className="text-2xl font-bold text-green-600 mb-1">
                                        {sections.length.toLocaleString()}
                                    </div>
                                    <div className="text-sm font-medium text-gray-600">Document Sections</div>
                                </div>
                                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                    <div className="text-lg font-bold text-purple-600 mb-1">
                                        {selectedProposal.regulation_type.replace('_', ' ').charAt(0).toUpperCase() +
                                            selectedProposal.regulation_type.replace('_', ' ').slice(1)}
                                    </div>
                                    <div className="text-sm font-medium text-gray-600">Regulation Type</div>
                                </div>
                                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                                    <div className="text-lg font-bold text-orange-600 mb-1">
                                        EPA
                                    </div>
                                    <div className="text-sm font-medium text-gray-600">Agency</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Section */}
                    <div className="bg-gray-50 border-t border-gray-200 p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Document Structure Action */}
                            <div className="group relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-200"></div>
                                <div className="relative bg-white rounded-xl p-6 border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-200">
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0-1.125.504-1.125 1.125V11.25a9 9 0 00-9-9z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                                Analyze Document Structure
                                            </h3>
                                            <p className="text-gray-600 mb-4 leading-relaxed">
                                                Explore the document's {sections.length} sections and discover which parts receive the most public attention through AI-powered comment analysis.
                                            </p>
                                            <Link
                                                href={`/document?proposal=${selectedProposalId}`}
                                                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                            >
                                                View Document Structure
                                                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Comments Analysis Action */}
                            <div className="group relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-200"></div>
                                <div className="relative bg-white rounded-xl p-6 border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-200">
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                                Explore Public Comments
                                            </h3>
                                            <p className="text-gray-600 mb-4 leading-relaxed">
                                                Browse through {comments.length.toLocaleString()} public comments and see how they map to specific document sections using advanced AI analysis.
                                            </p>
                                            <Link
                                                href={`/document?proposal=${selectedProposalId}`}
                                                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                            >
                                                Analyze Comments
                                                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Detailed Information */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Proposal Details */}
                <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Proposal Details</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Agency</label>
                                <p className="text-gray-900 font-medium">{selectedProposal.agency}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Agency</label>
                                <p className="text-gray-900 font-medium">{officeInfo.office}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Proposal Date</label>
                                <p className="text-gray-900 font-medium">{formatDate(selectedProposal.proposal_date)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Status</label>
                                <p className="text-gray-900 font-medium capitalize">{selectedProposal.status}</p>
                            </div>
                        </div>

                        {(selectedProposal.comment_period_start || selectedProposal.comment_period_end) && (
                            <div className="pt-4 border-t border-gray-100">
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Comment Period</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-gray-400">Start Date</label>
                                        <p className="text-gray-900">{formatDate(selectedProposal.comment_period_start)}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-400">End Date</label>
                                        <p className="text-gray-900">{formatDate(selectedProposal.comment_period_end)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* External Resources */}
                <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">External Resources</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        {selectedProposal.source_url && (
                            <a
                                href={selectedProposal.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors group"
                            >
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900 group-hover:text-blue-600">View Original Document</div>
                                    <div className="text-sm text-gray-500">regulations.gov</div>
                                </div>
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </a>
                        )}

                        <a
                            href={`https://www.regulations.gov/docket/${selectedProposal.docket_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors group"
                        >
                            <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center mr-4">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <div className="font-medium text-gray-900 group-hover:text-gray-600">View Complete Docket</div>
                                <div className="text-sm text-gray-500">All related documents</div>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </a>

                        {selectedProposal.metadata && Object.keys(selectedProposal.metadata).length > 0 && (
                            <div className="pt-4 border-t border-gray-100">
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Additional Information</h3>
                                <div className="space-y-2">
                                    {Object.entries(selectedProposal.metadata).map(([key, value]) => (
                                        <div key={key} className="flex justify-between text-sm">
                                            <span className="font-medium text-gray-600 capitalize">
                                                {key.replace('_', ' ')}:
                                            </span>
                                            <span className="text-gray-900">
                                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}