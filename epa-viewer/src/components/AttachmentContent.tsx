'use client';

import React, { useState } from 'react';

interface AttachmentContentProps {
    attachments: Array<{ filename: string; text: string }>;
}

const AttachmentContent: React.FC<AttachmentContentProps> = ({ attachments }) => {
    const [expandedAttachments, setExpandedAttachments] = useState<Set<number>>(new Set());

    // Parse attachments if they come as a JSON string (safety check)
    let parsedAttachments = attachments;
    if (typeof attachments === 'string') {
        try {
            parsedAttachments = JSON.parse(attachments);
        } catch (e) {
            console.error('Failed to parse attachment contents:', e);
            return null;
        }
    }

    if (!parsedAttachments || parsedAttachments.length === 0) {
        return null;
    }

    const toggleAttachment = (index: number) => {
        const newExpanded = new Set(expandedAttachments);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedAttachments(newExpanded);
    };

    return (
        <div className="mt-6 space-y-4">
            <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                Attachment Content ({parsedAttachments.length})
            </h4>

            {parsedAttachments.map((attachment, index) => (
                <div key={index} className="border border-gray-200 rounded-lg">
                    <button
                        onClick={() => toggleAttachment(index)}
                        className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg flex items-center justify-between"
                    >
                        <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">
                                {attachment.filename || `Attachment ${index + 1}`}
                            </span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-xs text-gray-500 mr-2">
                                {attachment.text ? `${attachment.text.length.toLocaleString()} characters` : 'No content'}
                            </span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-4 w-4 text-gray-400 transition-transform ${expandedAttachments.has(index) ? 'rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </button>

                    {expandedAttachments.has(index) && (
                        <div className="px-4 py-3 border-t border-gray-200">
                            {attachment.text ? (
                                <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto bg-gray-50 p-3 rounded">
                                    {attachment.text}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500 italic">
                                    No text content available for this attachment.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default AttachmentContent;