'use client';

import { Proposal } from '../lib/supabase';

interface ProposalDetailsProps {
    proposal: Proposal;
    commentCount?: number;
    sectionCount?: number;
}

const ProposalDetails = ({ proposal, commentCount, sectionCount }: ProposalDetailsProps) => {
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
        return { office: 'Environmental Protection Agency', office_code: 'EPA' };
    };

    const officeInfo = getOfficeInfo(proposal);

    return (
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm">
            {/* Header Section */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {proposal.docket_id}
                            </h2>
                            <span className={`px-3 py-1 text-sm font-medium rounded-lg border ${getStatusColor(proposal.status)}`}>
                                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2">
                            {proposal.title.trim()}
                        </h3>
                        {proposal.description && (
                            <p className="text-gray-600 leading-relaxed">
                                {proposal.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                            {commentCount !== undefined ? commentCount.toLocaleString() : '—'}
                        </div>
                        <div className="text-sm text-gray-600">Comments</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                            {sectionCount !== undefined ? sectionCount.toLocaleString() : '—'}
                        </div>
                        <div className="text-sm text-gray-600">Sections</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-xl font-bold text-purple-600">
                            {proposal.regulation_type.replace('_', ' ').charAt(0).toUpperCase() +
                                proposal.regulation_type.replace('_', ' ').slice(1)}
                        </div>
                        <div className="text-sm text-gray-600">Type</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-lg font-bold text-orange-600">
                            {officeInfo.office_code || 'EPA'}
                        </div>
                        <div className="text-sm text-gray-600">Office</div>
                    </div>
                </div>
            </div>

            {/* Details Section */}
            <div className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Proposal Details</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Agency</label>
                            <p className="text-gray-900">{proposal.agency}</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">Office</label>
                            <p className="text-gray-900">{officeInfo.office}</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">Proposal Date</label>
                            <p className="text-gray-900">{formatDate(proposal.proposal_date)}</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">Regulation Type</label>
                            <p className="text-gray-900 capitalize">
                                {proposal.regulation_type.replace('_', ' ')}
                            </p>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Comment Period Start</label>
                            <p className="text-gray-900">{formatDate(proposal.comment_period_start)}</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">Comment Period End</label>
                            <p className="text-gray-900">{formatDate(proposal.comment_period_end)}</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">Status</label>
                            <p className="text-gray-900 capitalize">{proposal.status}</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">Created</label>
                            <p className="text-gray-900">{formatDate(proposal.created_at)}</p>
                        </div>
                    </div>
                </div>

                {/* External Links */}
                {proposal.source_url && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <h5 className="text-md font-semibold text-gray-900 mb-3">External Resources</h5>
                        <div className="flex flex-wrap gap-3">
                            <a
                                href={proposal.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                View on Regulations.gov
                            </a>

                            {/* Construct additional useful links */}
                            <a
                                href={`https://www.regulations.gov/docket/${proposal.docket_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                View Docket
                            </a>
                        </div>
                    </div>
                )}

                {/* Metadata */}
                {proposal.metadata && Object.keys(proposal.metadata).length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <h5 className="text-md font-semibold text-gray-900 mb-3">Additional Information</h5>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                {Object.entries(proposal.metadata).map(([key, value]) => (
                                    <div key={key} className="flex justify-between">
                                        <span className="font-medium text-gray-700 capitalize">
                                            {key.replace('_', ' ')}:
                                        </span>
                                        <span className="text-gray-900">
                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProposalDetails;