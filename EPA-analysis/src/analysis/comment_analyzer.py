#!/usr/bin/env python3
import os
import json
import argparse
import requests
from dotenv import load_dotenv
from tqdm import tqdm

# Load environment variables
load_dotenv()

class CommentAnalyzer:
    """Analyzes EPA comments to identify which sections they address"""

    def __init__(self, openai_api_key=None):
        """Initialize the analyzer with API keys"""
        # Setup OpenAI
        self.openai_api_key = openai_api_key or os.environ.get("OPENAI_API_KEY")

    def analyze_comment(self, comment):
        """
        Use OpenAI to analyze a comment and identify which sections it addresses

        Args:
            comment: Dictionary containing comment data

        Returns:
            Dictionary with analysis results
        """
        # Extract relevant comment information from the scraper format
        comment_id = comment.get("comment_id", comment.get("id", "Unknown"))
        comment_title = comment.get("title", comment.get("comment_title", ""))

        # Get comment text from various possible locations in the JSON structure
        comment_text = ""
        if "comment_text" in comment:
            comment_text = comment["comment_text"]
        elif "text" in comment:
            comment_text = comment["text"]
        elif "content" in comment:
            comment_text = comment["content"]
        elif "markdown" in comment:
            comment_text = comment["markdown"]

        # Create a prompt for the LLM
        prompt = f"""
        Analyze the following EPA comment and identify which specific sections of the EPA regulatory document
        "Increasing Recycling: Adding Aerosol Cans to Universal Waste Regulations" it is addressing.

        Comment ID: {comment_id}
        Comment Title: {comment_title}

        Comment Text:
        {comment_text}

        Please identify the specific sections this comment addresses. Example format:
        Section IV.B.2: Proposed Requirements for Puncturing and Draining
        Section VI: Requests for Comment – Worker Safety and SOP

        Only list sections that are clearly addressed in the comment. If no specific sections can be identified, state "No specific sections identified".
        """

        # Call the OpenAI API directly using requests
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.openai_api_key}"
            }

            payload = {
                "model": "gpt-4",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert environmental policy analyst who specializes in identifying which sections of EPA regulatory documents public comments are addressing."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.3,
                "max_tokens": 1000
            }

            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload
            )

            response_data = response.json()

            if 'error' in response_data:
                raise Exception(f"API Error: {response_data['error']['message']}")

            # Extract the response text
            section_analysis = response_data['choices'][0]['message']['content'].strip()

            return {
                "id": comment_id,
                "title": comment_title,
                "section_analysis": section_analysis,
                "comment_text": comment_text[:500] + "..." if len(comment_text) > 500 else comment_text  # Include abbreviated text
            }
        except Exception as e:
            return {
                "id": comment_id,
                "title": comment_title,
                "section_analysis": f"Error during analysis: {str(e)}",
                "comment_text": comment_text[:500] + "..." if len(comment_text) > 500 else comment_text
            }

    def analyze_comments_file(self, input_file, output_file=None):
        """
        Analyze all comments in a file

        Args:
            input_file: Path to the JSON file containing comments
            output_file: Path to save the analysis results

        Returns:
            List of analysis results
        """
        # Load comments
        print(f"Loading comments from {input_file}")
        with open(input_file, 'r') as f:
            data = json.load(f)

        # Determine the structure of the JSON data
        # The structure can vary depending on how the scraper saved it
        comments = []
        if isinstance(data, list):
            comments = data
        elif isinstance(data, dict):
            # Try different possible keys
            if 'comments' in data:
                comments = data['comments']
            elif 'results' in data:
                comments = data['results']
            elif 'data' in data:
                comments = data['data']
            else:
                # If we can't find a list of comments, try using the whole dict as a single comment
                comments = [data]

        print(f"Found {len(comments)} comments to analyze")

        # Analyze each comment
        results = []
        for comment in tqdm(comments, desc="Analyzing comments"):
            result = self.analyze_comment(comment)
            results.append(result)

            # Print the result in the specified format
            print("\n" + "="*80)
            print(f"✅ Comment: {result['id']}")
            if result['title']:
                print(f"From: {result['title']}")
            print("\nRelevant to:")
            print(result['section_analysis'])
            print("="*80)

        # Save results if output file is specified
        if output_file:
            # Create output directory if it doesn't exist
            output_dir = os.path.dirname(output_file)
            if output_dir and not os.path.exists(output_dir):
                os.makedirs(output_dir)

            with open(output_file, 'w') as f:
                json.dump(results, f, indent=2)
            print(f"Results saved to {output_file}")

        return results

def main():
    parser = argparse.ArgumentParser(description="Analyze EPA comments to identify which sections they address")
    parser.add_argument("--input", "-i", required=True, help="Input JSON file with comments")
    parser.add_argument("--output", "-o", help="Output JSON file for analysis results")
    parser.add_argument("--api-key", help="OpenAI API key (defaults to OPENAI_API_KEY env var)")

    args = parser.parse_args()

    analyzer = CommentAnalyzer(openai_api_key=args.api_key)
    analyzer.analyze_comments_file(args.input, args.output)

if __name__ == "__main__":
    main()