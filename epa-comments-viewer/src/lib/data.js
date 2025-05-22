import fs from 'fs';
import path from 'path';

// Function to load and process all comment data
export async function loadCommentsData() {
    try {
        // Load the structured comments JSON
        const commentsPath = path.join(process.cwd(), '../Scraping/output/epa_EPA-HQ-OLEM-2017-0463-0001_20250522_172314_structured.json');
        const commentsData = JSON.parse(fs.readFileSync(commentsPath, 'utf8'));

        // Load the analysis results JSON
        const analysisPath = path.join(process.cwd(), '../output/analysis_results.json');
        const analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));

        // Merge the data into a comprehensive dataset
        const mergedData = mergeCommentsWithAnalysis(commentsData, analysisData);

        // Create section-based indexes
        const sectionIndex = createSectionIndex(mergedData);

        return {
            comments: mergedData,
            sections: sectionIndex,
            stats: calculateStats(mergedData, sectionIndex)
        };
    } catch (error) {
        console.error('Error loading comments data:', error);
        return {
            comments: [],
            sections: {},
            stats: { totalComments: 0, commentedSections: 0, topSections: [] }
        };
    }
}

// Function to merge comments with their analysis
function mergeCommentsWithAnalysis(comments, analysis) {
    const analysisMap = new Map();

    // Create a lookup map for analysis results by comment ID
    analysis.forEach(item => {
        analysisMap.set(item.comment_id, item.sections);
    });

    // Merge comments with their analysis
    return comments.map(comment => {
        return {
            ...comment,
            sections: analysisMap.get(comment.comment_id) || []
        };
    });
}

// Function to create a section index for quick lookups
function createSectionIndex(comments) {
    const sections = {};

    comments.forEach(comment => {
        (comment.sections || []).forEach(section => {
            const sectionKey = section.replace(/\s+/g, '-').toLowerCase();

            if (!sections[section]) {
                sections[section] = {
                    key: sectionKey,
                    title: section,
                    comments: []
                };
            }

            sections[section].comments.push(comment);
        });
    });

    return sections;
}

// Calculate overall statistics
function calculateStats(comments, sectionIndex) {
    // Get total comments
    const totalComments = comments.length;

    // Get comments with sections
    const commentsWithSections = comments.filter(c =>
        (c.sections || []).length > 0
    ).length;

    // Get top sections by comment count
    const sectionsList = Object.values(sectionIndex);
    const topSections = sectionsList
        .sort((a, b) => b.comments.length - a.comments.length)
        .slice(0, 10)
        .map(section => ({
            title: section.title,
            count: section.comments.length
        }));

    return {
        totalComments,
        commentsWithSections,
        totalSections: sectionsList.length,
        topSections
    };
}

// Function to get a specific section and its comments
export async function getSectionData(sectionKey) {
    const { sections } = await loadCommentsData();

    // Find the section by key
    const section = Object.values(sections).find(s => s.key === sectionKey);

    if (!section) {
        return null;
    }

    return section;
}

// Function to get a specific comment by ID
export async function getCommentById(commentId) {
    const { comments } = await loadCommentsData();

    return comments.find(c => c.comment_id === commentId) || null;
}

// Search comments by query text
export async function searchComments(query) {
    if (!query || query.trim() === '') {
        return [];
    }

    const { comments } = await loadCommentsData();
    const searchTerm = query.toLowerCase();

    return comments.filter(comment => {
        const text = (comment.comment_text || '').toLowerCase();
        const name = (comment.commenter_name || '').toLowerCase();
        const org = (comment.organization || '').toLowerCase();
        const sections = (comment.sections || []).join(' ').toLowerCase();

        return (
            text.includes(searchTerm) ||
            name.includes(searchTerm) ||
            org.includes(searchTerm) ||
            sections.includes(searchTerm)
        );
    });
}