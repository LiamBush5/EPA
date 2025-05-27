import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface CommentSummary {
    mainThemes: string[];
    keyPoints: string[];
    sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    summary: string;
    concerns: string[];
    suggestions: string[];
}

export async function generateCommentsSummary(
    comments: Array<{
        comment_text: string;
        commenter_name: string;
        organization?: string;
        attachment_contents?: any;
    }>,
    sectionTitle: string,
    sectionNumber: string
): Promise<CommentSummary> {
    if (comments.length === 0) {
        return {
            mainThemes: [],
            keyPoints: [],
            sentiment: 'neutral',
            summary: 'No comments available for analysis.',
            concerns: [],
            suggestions: []
        };
    }

    // Prepare comment text for analysis
    const commentTexts = comments.map((comment, index) => {
        let text = `Comment ${index + 1} by ${comment.commenter_name}`;
        if (comment.organization) {
            text += ` (${comment.organization})`;
        }
        text += `:\n${comment.comment_text}`;

        // Include attachment content if available
        if (comment.attachment_contents) {
            let attachmentText = '';

            // Handle different attachment_contents formats
            if (Array.isArray(comment.attachment_contents)) {
                attachmentText = comment.attachment_contents
                    .map((att: any) => att.content || att.text || '')
                    .join('\n')
                    .substring(0, 1000); // Limit attachment text to avoid token limits
            } else if (typeof comment.attachment_contents === 'string') {
                attachmentText = comment.attachment_contents.substring(0, 1000);
            } else if (comment.attachment_contents && typeof comment.attachment_contents === 'object') {
                // Handle case where it might be a single object or JSON
                try {
                    const attachmentObj = comment.attachment_contents as any;
                    if (attachmentObj.content) {
                        attachmentText = String(attachmentObj.content).substring(0, 1000);
                    } else if (attachmentObj.text) {
                        attachmentText = String(attachmentObj.text).substring(0, 1000);
                    } else {
                        // Try to stringify the object
                        attachmentText = JSON.stringify(attachmentObj).substring(0, 1000);
                    }
                } catch (e) {
                    // If parsing fails, try to convert to string
                    attachmentText = String(comment.attachment_contents).substring(0, 1000);
                }
            }

            if (attachmentText.trim()) {
                text += `\n[Attachment content excerpt: ${attachmentText}...]`;
            }
        }

        return text;
    }).join('\n\n---\n\n');

    const prompt = `You are analyzing public comments for EPA regulatory document section "${sectionNumber} ${sectionTitle}".

Please analyze the following ${comments.length} comments and provide a comprehensive summary in JSON format:

${commentTexts}

Provide your analysis in the following JSON structure:
{
  "mainThemes": ["theme1", "theme2", "theme3"],
  "keyPoints": ["point1", "point2", "point3"],
  "sentiment": "positive|negative|neutral|mixed",
  "summary": "A 2-3 sentence overview of what commenters are saying about this section",
  "concerns": ["concern1", "concern2"],
  "suggestions": ["suggestion1", "suggestion2"]
}

Focus on:
- Main themes and topics discussed
- Key concerns raised by commenters
- Suggestions or recommendations made
- Overall sentiment toward the regulation
- Common patterns across multiple comments

Keep each array item concise (1-2 sentences max). The summary should be accessible to both technical and non-technical readers.`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert analyst specializing in regulatory public comments. Provide objective, balanced analysis in valid JSON format only.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 1000,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No response from OpenAI');
        }

        // Clean the response - remove markdown code blocks if present
        let cleanContent = content.trim();
        if (cleanContent.startsWith('```json')) {
            cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanContent.startsWith('```')) {
            cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        // Parse the JSON response
        const summary = JSON.parse(cleanContent) as CommentSummary;
        return summary;
    } catch (error) {
        console.error('Error generating AI summary:', error);

        // Return a fallback summary
        return {
            mainThemes: ['Analysis temporarily unavailable'],
            keyPoints: ['AI summary generation encountered an error'],
            sentiment: 'neutral',
            summary: 'Unable to generate AI summary at this time. Please try again later.',
            concerns: [],
            suggestions: []
        };
    }
}