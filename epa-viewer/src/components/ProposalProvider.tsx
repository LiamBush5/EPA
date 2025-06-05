'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Proposal } from '../lib/supabase';

interface ProposalContextType {
    proposals: Proposal[];
    selectedProposalId: string | null;
    selectedProposal: Proposal | null;
    setSelectedProposalId: (id: string) => void;
    isLoading: boolean;
}

const ProposalContext = createContext<ProposalContextType | undefined>(undefined);

interface ProposalProviderProps {
    children: ReactNode;
    initialProposals: Proposal[];
    defaultProposalId?: string;
}

export function ProposalProvider({
    children,
    initialProposals,
    defaultProposalId
}: ProposalProviderProps) {
    const [proposals] = useState<Proposal[]>(initialProposals);
    const [selectedProposalId, setSelectedProposalId] = useState<string | null>(
        defaultProposalId || (initialProposals.length > 0 ? initialProposals[0].proposal_id : null)
    );
    const [isLoading, setIsLoading] = useState(false);

    const selectedProposal = proposals.find(p => p.proposal_id === selectedProposalId) || null;

    const handleProposalChange = (id: string) => {
        setIsLoading(true);
        setSelectedProposalId(id);

        // Update URL to reflect the selected proposal
        const url = new URL(window.location.href);
        url.searchParams.set('proposal', id);
        window.history.replaceState({}, '', url.toString());

        // Small delay to show loading state
        setTimeout(() => setIsLoading(false), 300);
    };

    useEffect(() => {
        // Check URL for proposal parameter on mount
        const urlParams = new URLSearchParams(window.location.search);
        const proposalFromUrl = urlParams.get('proposal');

        if (proposalFromUrl && proposals.find(p => p.proposal_id === proposalFromUrl)) {
            setSelectedProposalId(proposalFromUrl);
        }
    }, [proposals]);

    return (
        <ProposalContext.Provider
            value={{
                proposals,
                selectedProposalId,
                selectedProposal,
                setSelectedProposalId: handleProposalChange,
                isLoading,
            }}
        >
            {children}
        </ProposalContext.Provider>
    );
}

export function useProposal() {
    const context = useContext(ProposalContext);
    if (context === undefined) {
        throw new Error('useProposal must be used within a ProposalProvider');
    }
    return context;
}