import Link from 'next/link';
import { DocumentSection } from '../lib/supabase';

interface DocumentStructureProps {
    sections: DocumentSection[];
    commentCounts: Record<string, number>;
}

const DocumentStructure = ({ sections, commentCounts }: DocumentStructureProps) => {
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

    const sectionTree = buildTree(sections);

    // Recursive component to render the tree
    const renderSectionTree = (tree: Record<string, any>, level: number = 0) => {
        return (
            <ul className={`space-y-1 ${level > 0 ? 'pl-5' : ''}`}>
                {Object.values(tree).map((section: any) => {
                    const commentCount = commentCounts[section.section_id] || 0;
                    const hasChildren = Object.keys(section.children).length > 0;

                    return (
                        <li key={section.section_id} className={`py-2 ${level > 0 ? 'border-l-2 border-gray-100 pl-4' : ''}`}>
                            <div className="flex items-center">
                                <Link
                                    href={`/sections/${section.section_id}`}
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
                                    {commentCount > 0 && (
                                        <span className="openai-badge openai-badge-blue ml-2">
                                            {commentCount}
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

    return (
        <div className="openai-card p-6">
            <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Document Structure</h3>
                <p className="text-sm text-gray-500">
                    Explore the hierarchical structure of the document. Sections with comments are highlighted with a count badge.
                </p>
            </div>
            {renderSectionTree(sectionTree)}
        </div>
    );
};

export default DocumentStructure;