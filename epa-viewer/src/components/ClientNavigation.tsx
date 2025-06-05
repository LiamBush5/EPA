'use client';

import Link from 'next/link';
import { useProposal } from './ProposalProvider';

export default function ClientNavigation() {
    const { selectedProposalId } = useProposal();

    return (
        <nav className="flex items-center space-x-5">
            <Link
                href={selectedProposalId ? `/document?proposal=${selectedProposalId}` : '/document'}
                className="text-sm text-gray-600 hover:text-gray-900"
            >
                Document Structure
            </Link>
            <a
                href="https://www.epa.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-gray-900"
            >
                EPA Website
            </a>
        </nav>
    );
}