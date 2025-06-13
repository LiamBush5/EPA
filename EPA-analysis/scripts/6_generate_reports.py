#!/usr/bin/env python3

import re
import json
from collections import OrderedDict

def load_commenter_info():
    """Load commenter information from the original JSON data."""
    try:
        with open('../processed/epa_comments_with_attachment_content_correct.json', 'r') as f:
            comments_data = json.load(f)

        # Create a lookup dictionary by comment ID
        commenter_info = {}
        for comment in comments_data:
            comment_id = comment.get('comment_id')
            if comment_id:
                commenter_info[comment_id] = {
                    'name': comment.get('commenter_name', 'Unknown'),
                    'organization': comment.get('organization', 'None specified'),
                    'date': comment.get('comment_date', 'Unknown date')
                }
        return commenter_info
    except (FileNotFoundError, json.JSONDecodeError):
        print("Warning: Could not load commenter information. Will proceed without it.")
        return {}

def parse_sections_and_comments(commenter_info):
    """Parse the detailed_by_section.txt file and reorganize it by section."""
    with open('../output/detailed_by_section.txt', 'r') as f:
        content = f.read()

    # Split the content by section headers
    sections = {}
    current_section = None

    # Use regex to find section headers and comments
    section_pattern = re.compile(r'(Section [^(]+)(\(\d+ comments\)):\n-+\n(.*?)(?=\n\n(?:Section |$))', re.DOTALL)
    comment_pattern = re.compile(r'Comment (EPA-HQ-OLEM-[0-9-]+)\n\nText: (.*?)\n\nAnalysis:', re.DOTALL)

    for match in section_pattern.finditer(content):
        section_name = match.group(1).strip()
        section_content = match.group(3)

        if section_name not in sections:
            sections[section_name] = []

        # Find all comments in this section
        for comment_match in comment_pattern.finditer(section_content):
            comment_id = comment_match.group(1)
            comment_text = comment_match.group(2).strip()

            # Get commenter info if available
            info = commenter_info.get(comment_id, {
                'name': 'Unknown',
                'organization': 'Unknown',
                'date': 'Unknown date'
            })

            sections[section_name].append({
                'id': comment_id,
                'text': comment_text,
                'commenter_name': info['name'],
                'organization': info['organization'],
                'date': info['date']
            })

    # Sort sections alphabetically
    sorted_sections = OrderedDict(sorted(sections.items()))
    return sorted_sections

def write_formatted_output(sections):
    """Write the sections and comments to a well-formatted output file."""
    with open('../output/reorganized_by_section.txt', 'w') as f:
        f.write("="*80 + "\n")
        f.write("SECTIONS AND THEIR COMMENTS\n")
        f.write("="*80 + "\n\n")

        for section_name, comments in sections.items():
            f.write(f"{section_name} ({len(comments)} comments):\n")
            f.write("-"*80 + "\n")

            for i, comment in enumerate(comments, 1):
                f.write(f"Comment {i}: {comment['id']}\n")
                f.write(f"Commenter: {comment['commenter_name']}\n")
                f.write(f"Organization: {comment['organization']}\n")
                f.write(f"Date: {comment['date']}\n\n")

                # Format the text to be more readable (wrapped at 80 chars)
                text_lines = [comment['text'][i:i+80] for i in range(0, len(comment['text']), 80)]
                for line in text_lines:
                    f.write(f"{line}\n")

                if i < len(comments):  # Don't add separator after the last comment
                    f.write("\n" + "-"*40 + "\n\n")

            f.write("\n\n")

if __name__ == "__main__":
    # Load commenter information
    commenter_info = load_commenter_info()
    print(f"Loaded commenter information for {len(commenter_info)} comments")

    # Extract and organize sections and comments
    sections = parse_sections_and_comments(commenter_info)

    # Write the formatted output
    write_formatted_output(sections)

    print(f"Finished reorganizing. Output saved to ../output/reorganized_by_section.txt")

    # Print summary
    print("\nSummary of sections:")
    for section, comments in sections.items():
        print(f"{section}: {len(comments)} comments")