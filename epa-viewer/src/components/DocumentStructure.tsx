import Link from 'next/link';
import { DocumentSection } from '../lib/supabase';

interface DocumentStructureProps {
    sections: DocumentSection[];
    commentCounts: Record<string, number>;
    proposalId?: string;
}

const DocumentStructure = ({ sections, commentCounts, proposalId }: DocumentStructureProps) => {
    // Separate special sections that should appear at the end
    const specialSections = ['REGULATORY_TEXT', 'FOOTNOTES'];

    // Filter out special sections from main structure
    const mainSections = sections.filter(section =>
        !specialSections.includes(section.section_number)
    );

    // Get special sections to display at the end
    const endSections = sections.filter(section =>
        specialSections.includes(section.section_number)
    );

    // Function to build a hierarchical tree from flat sections array
    const buildTree = (sections: DocumentSection[]) => {
        const tree: Record<string, any> = {};
        const rootSections = sections.filter(section => !section.parent_section_id);

        // Process root sections
        rootSections.forEach(section => {
            tree[section.section_id] = {
                ...section,
                children: {}
            };
        });

        // Process child sections
        sections
            .filter(section => section.parent_section_id)
            .forEach(section => {
                if (!section.parent_section_id) return;

                // Find the parent node at any level in the tree
                const findParentAndAddChild = (nodes: Record<string, any>) => {
                    for (const id in nodes) {
                        if (id === section.parent_section_id) {
                            nodes[id].children[section.section_id] = {
                                ...section,
                                children: {}
                            };
                            return true;
                        }

                        if (Object.keys(nodes[id].children).length > 0) {
                            if (findParentAndAddChild(nodes[id].children)) {
                                return true;
                            }
                        }
                    }
                    return false;
                };

                findParentAndAddChild(tree);
            });

        return tree;
    };

    const sectionTree = buildTree(mainSections);

    // Create link with optional proposal parameter
    const createSectionLink = (sectionId: string) => {
        return proposalId ? `/sections/${sectionId}?proposal=${proposalId}` : `/sections/${sectionId}`;
    };

    // Recursive component to render the tree
    const renderSectionTree = (tree: Record<string, any>, level: number = 0) => {
        return (
            <ul className={`space-y-1 ${level > 0 ? 'pl-5' : ''}`}>
                {Object.values(tree).map((section: any) => {
                    const matchCount = commentCounts[section.section_id] || 0;
                    const hasChildren = Object.keys(section.children).length > 0;

                    return (
                        <li key={section.section_id} className={`py-2 ${level > 0 ? 'border-l-2 border-gray-100 pl-4' : ''}`}>
                            <div className="flex items-center">
                                <Link
                                    href={createSectionLink(section.section_id)}
                                    className="group flex-1 flex items-center text-gray-900 hover:text-blue-600 transition-colors"
                                >
                                    {hasChildren && (
                                        <span className="mr-2 text-gray-400 group-hover:text-blue-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                    )}
                                    <span className="text-sm text-gray-500 mr-2">{section.section_number}</span>
                                    <span className="text-sm font-medium flex-1">{section.section_title}</span>
                                    {matchCount > 0 && (
                                        <span className="openai-badge openai-badge-blue ml-2">
                                            {matchCount}
                                        </span>
                                    )}
                                </Link>
                            </div>

                            {hasChildren && renderSectionTree(section.children, level + 1)}
                        </li>
                    );
                })}
            </ul>
        );
    };

    // Component to render special sections at the end
    const renderEndSections = () => {
        if (endSections.length === 0) return null;

        return (
            <div className="mt-8 pt-6 border-t border-gray-200">
                <ul className="space-y-1">
                    {endSections.map((section) => {
                        const matchCount = commentCounts[section.section_id] || 0;

                        return (
                            <li key={section.section_id} className="py-2">
                                <div className="flex items-center">
                                    <Link
                                        href={createSectionLink(section.section_id)}
                                        className="group flex-1 flex items-center text-gray-900 hover:text-blue-600 transition-colors"
                                    >
                                        <span className="text-sm text-gray-500 mr-2">{section.section_number}</span>
                                        <span className="text-sm font-medium flex-1">{section.section_title}</span>
                                        {matchCount > 0 && (
                                            <span className="openai-badge openai-badge-blue ml-2">
                                                {matchCount}
                                            </span>
                                        )}
                                    </Link>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    };

    return (
        <div className="openai-card p-6">
            <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Document Structure</h3>
                <p className="text-sm text-gray-500">
                    Explore the hierarchical structure of the document. The numbers show how many comment matches each section has received.
                </p>
            </div>
            {renderSectionTree(sectionTree)}
            {renderEndSections()}
        </div>
    );
};

export default DocumentStructure;