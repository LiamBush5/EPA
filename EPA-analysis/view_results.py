#!/usr/bin/env python3
import json
import argparse
import os

def view_results(results_file, output_file=None):
    """View analysis results"""
    if not os.path.exists(results_file):
        print(f"Error: {results_file} does not exist")
        return

    with open(results_file, 'r') as f:
        results = json.load(f)

    print(f"Found {len(results)} analyzed comments")
    print("\n")

    # Group comments by section
    sections = {}
    for result in results:
        section_analysis = result.get('section_analysis', 'Unknown')
        if "No specific sections identified" in section_analysis:
            if "No specific sections" not in sections:
                sections["No specific sections"] = []
            sections["No specific sections"].append(result)
            continue

        # Extract sections from the analysis
        lines = section_analysis.strip().split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Check if this looks like a section reference
            if line.startswith("Section"):
                if line not in sections:
                    sections[line] = []
                sections[line].append(result)

    # Print section summary
    print("=" * 80)
    print("SECTION SUMMARY")
    print("=" * 80)

    for section, comments in sorted(sections.items()):
        print(f"{section}: {len(comments)} comments")

    # Prepare detailed view with full comment text by section
    detailed_output = []
    detailed_output.append("\n")
    detailed_output.append("=" * 80)
    detailed_output.append("DETAILED VIEW BY SECTION WITH FULL COMMENTS")
    detailed_output.append("=" * 80)

    for section, comments in sorted(sections.items()):
        detailed_output.append(f"\n{section} ({len(comments)} comments):")
        detailed_output.append("-" * 80)

        for i, comment in enumerate(comments):
            detailed_output.append(f"Comment {comment['id']}" + (f": {comment['title']}" if comment['title'] else ""))
            detailed_output.append("")

            # Add the comment text, using full text from the database
            comment_text = comment.get('comment_text', 'No text available')
            detailed_output.append(f"Text: {comment_text}")

            # Add the section analysis for completeness
            detailed_output.append("")
            detailed_output.append(f"Analysis: {comment['section_analysis']}")

            # Add separator between comments
            if i < len(comments) - 1:  # if not the last comment
                detailed_output.append("\n" + "-" * 40 + "\n")
            else:
                detailed_output.append("")

    # Print to console (truncated for readability)
    print("\n")
    print("=" * 80)
    print("DETAILED VIEW BY SECTION (FIRST COMMENT OF EACH SECTION)")
    print("=" * 80)

    # Just print the first comment of each section to avoid overwhelming the console
    for section, comments in sorted(sections.items()):
        if comments:
            print(f"\n{section} ({len(comments)} comments):")
            print("-" * 80)

            comment = comments[0]  # just take the first comment
            print(f"Comment {comment['id']}" + (f": {comment['title']}" if comment['title'] else ""))
            print("")

            # Truncate comment text for display if too long
            comment_text = comment.get('comment_text', 'No text available')
            if len(comment_text) > 300:
                comment_text = comment_text[:300] + "..."
            print(f"Text: {comment_text}")
            print("")
            print(f"Analysis: {comment['section_analysis']}")
            print("")
            print(f"See full output file for all {len(comments)} comments addressing this section.")
            print("")

    # Save full output to file if specified
    if output_file:
        output_dir = os.path.dirname(output_file)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)

        with open(output_file, 'w') as f:
            f.write('\n'.join(detailed_output))
        print(f"\nFull detailed results saved to {output_file}")

def main():
    parser = argparse.ArgumentParser(description="View EPA comment analysis results")
    parser.add_argument("--results", "-r", required=True, help="Results JSON file")
    parser.add_argument("--output", "-o", help="Output file for detailed results")

    args = parser.parse_args()
    view_results(args.results, args.output)

if __name__ == "__main__":
    main()