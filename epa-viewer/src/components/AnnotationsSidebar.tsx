import { AnnotatedMatch } from '../lib/referenceDetection';

interface AnnotationsSidebarProps {
    annotations: AnnotatedMatch[];
    title?: string;
}

export default function AnnotationsSidebar({ annotations, title = "References & Matches" }: AnnotationsSidebarProps) {
    if (annotations.length === 0) return null;

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {title}
            </h3>

            <div className="space-y-3">
                {annotations.map((annotation) => (
                    <div
                        key={annotation.id}
                        className="annotation-item border-l-3 border-blue-300 pl-3 py-2 bg-white rounded-r-md shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        data-annotation-id={annotation.id}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center mb-1">
                                    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mr-2">
                                        {annotation.id}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded ${annotation.type === 'exact_match'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {annotation.type === 'exact_match' ? 'Exact Match' : 'Reference'}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-700 leading-relaxed">
                                    "{annotation.text.length > 100
                                        ? `${annotation.text.substring(0, 100)}...`
                                        : annotation.text}"
                                </p>

                                <div className="mt-2 flex items-center text-xs text-gray-500">
                                    <div className="flex items-center mr-3">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-1"></div>
                                        Confidence: {Math.round(annotation.confidence * 100)}%
                                    </div>
                                    {annotation.type === 'exact_match' && (
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                            Found in both texts
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {annotations.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 italic">
                        Click on numbered references [1], [2], etc. in the text to highlight the corresponding annotation.
                    </p>
                </div>
            )}
        </div>
    );
}