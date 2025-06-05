'use client';

import { useState, useEffect } from 'react';
import { Proposal } from '../lib/supabase';

interface ProposalSelectorProps {
    proposals: Proposal[];
    selectedProposalId: string | null;
    onProposalChange: (proposalId: string) => void;
}

export default function ProposalSelector({
    proposals,
    selectedProposalId,
    onProposalChange
}: ProposalSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedProposal = proposals.find(p => p.proposal_id === selectedProposalId);

    return (
        <div className="relative inline-block text-left">
            <div>
                <button
                    type="button"
                    className="inline-flex w-full justify-between items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 min-w-64"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                >
                    <div className="text-left flex-1">
                        {selectedProposal ? (
                            <div>
                                <div className="font-medium truncate">
                                    {selectedProposal.docket_id}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                    {selectedProposal.title.length > 50
                                        ? selectedProposal.title.substring(0, 47) + '...'
                                        : selectedProposal.title
                                    }
                                </div>
                            </div>
                        ) : (
                            <span className="text-gray-500">Select a proposal...</span>
                        )}
                    </div>
                    <svg
                        className={`-mr-1 h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            </div>

            {isOpen && (
                <div className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                        {proposals.map((proposal) => (
                            <button
                                key={proposal.proposal_id}
                                className={`group flex w-full items-start px-4 py-3 text-sm text-left hover:bg-gray-100 ${selectedProposalId === proposal.proposal_id ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                                    }`}
                                role="menuitem"
                                onClick={() => {
                                    onProposalChange(proposal.proposal_id);
                                    setIsOpen(false);
                                }}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium">{proposal.docket_id}</span>
                                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${proposal.status === 'closed'
                                            ? 'bg-gray-100 text-gray-800'
                                            : 'bg-green-100 text-green-800'
                                            }`}>
                                            {proposal.status}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600 line-clamp-2">
                                        {proposal.title}
                                    </div>
                                    {proposal.description && (
                                        <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                                            {proposal.description}
                                        </div>
                                    )}
                                </div>
                                {selectedProposalId === proposal.proposal_id && (
                                    <svg className="h-4 w-4 text-blue-600 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}