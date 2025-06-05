'use client';

import { useState } from 'react';
import { Proposal } from '../lib/supabase';

interface ProposalSelectorProps {
    proposals: Proposal[];
    selectedProposalId: string | null;
    onProposalChange: (proposalId: string) => void;
}

const ProposalSelector = ({ proposals, selectedProposalId, onProposalChange }: ProposalSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedProposal = proposals.find(p => p.proposal_id === selectedProposalId);

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
                        <div className="p-2 max-h-80 overflow-y-auto">
                            {proposals.map((proposal) => (
                                <button
                                    key={proposal.proposal_id}
                                    onClick={() => {
                                        onProposalChange(proposal.proposal_id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left p-3 rounded-lg transition-all duration-150 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 ${selectedProposalId === proposal.proposal_id ? 'bg-blue-50 border border-blue-200' : ''
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-900">
                                            {formatDocketId(proposal.docket_id)}
                                        </span>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${getStatusColor(proposal.status)}`}>
                                            {proposal.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                        {proposal.title.trim()}
                                    </p>
                                    {proposal.description && (
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                            {proposal.description}
                                        </p>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProposalSelector;