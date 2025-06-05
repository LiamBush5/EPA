'use client';

import Link from 'next/link';
import { useProposal } from './ProposalProvider';

export default function ClientNavigation() {
    const { selectedProposalId } = useProposal();

    return (
        <nav className="flex items-center space-x-1">
            <a
                href="https://www.epa.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100/60 rounded-lg transition-all duration-200 flex items-center space-x-1"
            >
                <span>EPA Website</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
            </a>
        </nav>
    );
}