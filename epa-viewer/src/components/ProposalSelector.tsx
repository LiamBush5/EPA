'use client';

import { useState, useEffect } from 'react';
import { Proposal } from '../lib/supabase';

interface ProposalSelectorProps {
    proposals: Proposal[];
    selectedProposalId: string | null;
    onProposalChange: (proposalId: string) => void;
}

interface ProposalWithStats extends Proposal {
    comment_count?: number;
}

const ProposalSelector = ({ proposals, selectedProposalId, onProposalChange }: ProposalSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [proposalsWithStats, setProposalsWithStats] = useState<ProposalWithStats[]>([]);
    const [loading, setLoading] = useState(true);

    const selectedProposal = proposalsWithStats.find(p => p.proposal_id === selectedProposalId);

    // Fetch comment counts for all proposals
    useEffect(() => {
        const fetchCommentCounts = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/proposals-stats');
                if (response.ok) {
                    const stats = await response.json();
                    const enhancedProposals = proposals.map(proposal => ({
                        ...proposal,
                        comment_count: stats[proposal.proposal_id] || 0
                    }));
                    setProposalsWithStats(enhancedProposals);
                } else {
                    // Fallback: just use proposals without stats
                    setProposalsWithStats(proposals);
                }
            } catch (error) {
                console.error('Error fetching comment counts:', error);
                setProposalsWithStats(proposals);
            } finally {
                setLoading(false);
            }
        };

        fetchCommentCounts();
    }, [proposals]);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return 'bg-green-100 text-green-700 border-green-200';
            case 'closed': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'draft': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    const formatDocketId = (docketId: string) => {
        // Shorten the docket ID by removing EPA-HQ- prefix
        return docketId.replace('EPA-HQ-', '');
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return null;
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return null;
        }
    };

    const getOfficeInfo = (proposal: Proposal) => {
        if (proposal.metadata?.office) {
            return {
                office: proposal.metadata.office,
                office_code: proposal.metadata.office_code || ''
            };
        }
        // Fallback: derive from docket ID
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
        return { office: 'EPA', office_code: '' };
    };

    const openExternalLink = (url: string, event: React.MouseEvent) => {
        event.stopPropagation();
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>

                    {selectedProposal ? (
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2 mb-0.5">
                                <span className="text-sm font-medium text-gray-900 truncate">
                                    {formatDocketId(selectedProposal.docket_id)}
                                </span>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${getStatusColor(selectedProposal.status)}`}>
                                    {selectedProposal.status}
                                </span>
                                {selectedProposal.comment_count !== undefined && (
                                    <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                        {selectedProposal.comment_count} comments
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-600 truncate">
                                {selectedProposal.title.trim()}
                            </p>
                        </div>
                    ) : (
                        <span className="text-sm text-gray-500">Select a proposal</span>
                    )}
                </div>

                <div className="flex-shrink-0 ml-2">
                    <svg
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200/60 rounded-xl shadow-lg backdrop-blur-xl z-20 overflow-hidden">
                        <div className="p-2 max-h-96 overflow-y-auto">
                            {proposalsWithStats.map((proposal) => {
                                const officeInfo = getOfficeInfo(proposal);
                                const proposalDate = formatDate(proposal.proposal_date);

                                return (
                                    <div
                                        key={proposal.proposal_id}
                                        className={`rounded-lg border transition-all duration-150 hover:bg-gray-50 ${selectedProposalId === proposal.proposal_id
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'border-transparent'
                                            }`}
                                    >
                                        <button
                                            onClick={() => {
                                                onProposalChange(proposal.proposal_id);
                                                setIsOpen(false);
                                            }}
                                            className="w-full text-left p-3 focus:outline-none focus:bg-gray-50"
                                        >
                                            {/* Header with docket ID, status, and external link */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {formatDocketId(proposal.docket_id)}
                                                    </span>
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${getStatusColor(proposal.status)}`}>
                                                        {proposal.status}
                                                    </span>
                                                </div>

                                                {proposal.source_url && (
                                                    <button
                                                        onClick={(e) => openExternalLink(proposal.source_url, e)}
                                                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                        title="View on Regulations.gov"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>

                                            {/* Title */}
                                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-2">
                                                {proposal.title.trim()}
                                            </p>

                                            {/* Description if available */}
                                            {proposal.description && (
                                                <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                                                    {proposal.description}
                                                </p>
                                            )}

                                            {/* Metadata row */}
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <div className="flex items-center space-x-3">
                                                    {/* Office */}
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                                                        {officeInfo.office_code || 'EPA'}
                                                    </span>

                                                    {/* Date */}
                                                    {proposalDate && (
                                                        <span>{proposalDate}</span>
                                                    )}
                                                </div>

                                                {/* Comment count */}
                                                {!loading && proposal.comment_count !== undefined && (
                                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                                                        {proposal.comment_count} comments
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProposalSelector;