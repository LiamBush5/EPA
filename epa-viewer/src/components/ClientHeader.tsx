'use client';

import { useProposal } from './ProposalProvider';
import ProposalSelector from './ProposalSelector';

export default function ClientHeader() {
    const { proposals, selectedProposalId, setSelectedProposalId } = useProposal();

    return (
        <ProposalSelector
            proposals={proposals}
            selectedProposalId={selectedProposalId}
            onProposalChange={setSelectedProposalId}
        />
    );
}