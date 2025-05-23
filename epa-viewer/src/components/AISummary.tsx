import React from 'react';
import { DocumentSection } from '../lib/supabase';

interface AISummaryProps {
    section: DocumentSection;
    comments: any[];
}

const AISummary = ({ section, comments }: AISummaryProps) => {
    // For a real application, this would call an AI API to generate insights
    // For now, we'll simulate AI insights with some static analysis

    const generateInsights = () => {
        if (comments.length === 0) {
            return {
                summary: "No comments have been submitted for this section yet.",
                sentiment: "neutral",
                topConcerns: [],
                recommendations: ["Monitor for future comments on this section."]
            };
        }

        // Calculate basic metrics
        const totalComments = comments.length;
        const averageScore = comments.reduce((sum, comment) => sum + comment.similarity_score, 0) / totalComments;
        const hasAttachments = comments.filter(comment => comment.has_attachments).length;

        // Determine sentiment based on comment count (this would be AI-generated in a real app)
        let sentiment = "neutral";
        if (totalComments > 5) sentiment = "high interest";

        // Generate mock recommendations
        const recommendations = [
            "Review comments for technical insights and potential regulatory impact.",
            "Consider the highlighted concerns in future revisions."
        ];

        if (hasAttachments > 0) {
            recommendations.push("Examine attachments for detailed technical feedback.");
        }

        return {
            summary: `This section has received ${totalComments} comments with an average match score of ${(averageScore * 100).toFixed(1)}%. ${hasAttachments} comments include attachments with additional information.`,
            sentiment,
            topConcerns: ["Environmental impact considerations", "Implementation timeline questions", "Technical feasibility concerns"],
            recommendations
        };
    };

    const insights = generateInsights();

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">AI Summary</h3>
                <p className="text-gray-700">{insights.summary}</p>
            </div>

            {comments.length > 0 && (
                <>
                    <div className="mb-4">
                        <h4 className="font-medium mb-1">Overall Sentiment</h4>
                        <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${insights.sentiment === 'high interest' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                            <span className="capitalize">{insights.sentiment}</span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <h4 className="font-medium mb-1">Top Concerns Identified</h4>
                        <ul className="list-disc pl-5">
                            {insights.topConcerns.map((concern, index) => (
                                <li key={index} className="text-gray-700">{concern}</li>
                            ))}
                        </ul>
                    </div>
                </>
            )}

            <div>
                <h4 className="font-medium mb-1">Recommendations</h4>
                <ul className="list-disc pl-5">
                    {insights.recommendations.map((recommendation, index) => (
                        <li key={index} className="text-gray-700">{recommendation}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default AISummary;