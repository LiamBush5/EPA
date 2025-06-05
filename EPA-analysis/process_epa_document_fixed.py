import os
import re
import uuid
import json
import argparse
from pathlib import Path

def extract_epa_sections_fixed(markdown_text):
    """
    Extract sections from EPA Federal Register markdown, properly handling the introductory content.
    Everything before "I. General Information" gets consolidated into a single intro section.
    """
    sections = []

    # Split the markdown by pages and normalize
    pages = re.split(r'---\n', markdown_text)
    text = '\n'.join(pages)
    text = re.sub(r'\r\n', '\n', text)

    # Find the start of "I. General Information"
    main_sections_start = re.search(r'^### I\. General Information', text, re.MULTILINE)
    if not main_sections_start:
        # Try alternative patterns
        main_sections_start = re.search(r'^# I\. General Information', text, re.MULTILINE)

    if main_sections_start:
        # Everything before "I. General Information" becomes the introduction
        intro_text = text[:main_sections_start.start()].strip()
        remaining_text = text[main_sections_start.start():]

        if intro_text:
            # Create consolidated introduction section
            intro_section = {
                'section_id': str(uuid.uuid4()),
                'section_number': 'INTRO',
                'section_title': 'Document Header and Supplementary Information',
                'section_text': intro_text,
                'hierarchy_level': 0,
                'parent_section_id': None
            }
            sections.append(intro_section)
    else:
        # If we can't find the main sections, treat the whole document as intro
        remaining_text = text
        intro_section = {
            'section_id': str(uuid.uuid4()),
            'section_number': 'INTRO',
            'section_title': 'Complete Document',
            'section_text': text.strip(),
            'hierarchy_level': 0,
            'parent_section_id': None
        }
        sections.append(intro_section)
        return sections

    # Now parse the main numbered sections (I, II, III, etc.)
    main_section_pattern = r'^### ([IVXLCDM]+)\.\s+([^\n]+)'
    sub_section_pattern = r'^#### ([A-Z])\.\s+([^\n]+)'

    # Find all main sections
    main_sections = list(re.finditer(main_section_pattern, remaining_text, re.MULTILINE))

    # If no main sections found with ###, try with #
    if not main_sections:
        main_section_pattern = r'^# ([IVXLCDM]+)\.\s+([^\n]+)'
        sub_section_pattern = r'^# ([A-Z])\.\s+([^\n]+)'
        main_sections = list(re.finditer(main_section_pattern, remaining_text, re.MULTILINE))

    parent_sections = {}  # Store section_id by section number for parent lookup

    # Process main sections
    for i, match in enumerate(main_sections):
        section_number = match.group(1)
        section_title = match.group(2).strip()
        start_pos = match.start()

        # Determine where this section ends
        if i < len(main_sections) - 1:
            end_pos = main_sections[i + 1].start()
        else:
            # For the last section, find regulatory text or end of document
            regulatory_text = re.search(r'^# PART \d+--', remaining_text[start_pos:], re.MULTILINE)
            if regulatory_text:
                end_pos = start_pos + regulatory_text.start()
            else:
                end_pos = len(remaining_text)

        # Extract section text
        section_text = remaining_text[start_pos:end_pos].strip()

        # Create main section
        section_id = str(uuid.uuid4())
        section = {
            'section_id': section_id,
            'section_number': section_number,
            'section_title': section_title,
            'section_text': section_text,
            'hierarchy_level': 1,
            'parent_section_id': None
        }

        sections.append(section)
        parent_sections[section_number] = section_id

    # Now find and process subsections within each main section
    for main_section in sections[1:]:  # Skip the intro section
        section_text = main_section['section_text']
        subsections = list(re.finditer(sub_section_pattern, section_text, re.MULTILINE))

        for j, sub_match in enumerate(subsections):
            sub_section_number = sub_match.group(1)
            sub_section_title = sub_match.group(2).strip()
            sub_start_pos = sub_match.start()

            # Determine where this subsection ends
            if j < len(subsections) - 1:
                sub_end_pos = subsections[j + 1].start()
            else:
                sub_end_pos = len(section_text)

            # Extract subsection text
            subsection_text = section_text[sub_start_pos:sub_end_pos].strip()

            # Create subsection
            subsection = {
                'section_id': str(uuid.uuid4()),
                'section_number': sub_section_number,
                'section_title': sub_section_title,
                'section_text': subsection_text,
                'hierarchy_level': 2,
                'parent_section_id': main_section['section_id']
            }

            sections.append(subsection)

    # Add regulatory text section if it exists
    regulatory_match = re.search(r'(^# PART \d+--.*?)(?=^#|\Z)', remaining_text, re.DOTALL | re.MULTILINE)
    if regulatory_match:
        regulatory_text = regulatory_match.group(1).strip()
        regulatory_section = {
            'section_id': str(uuid.uuid4()),
            'section_number': 'REGULATORY',
            'section_title': 'Regulatory Text Amendments',
            'section_text': regulatory_text,
            'hierarchy_level': 1,
            'parent_section_id': None
        }
        sections.append(regulatory_section)

    return sections

def clean_sections(sections):
    """
    Clean up sections by removing very short sections and ensuring proper formatting.
    """
    MIN_SECTION_LENGTH = 50  # Minimum character length for a section (lower than before)

    cleaned_sections = []
    for section in sections:
        # Skip extremely short sections (except intro and regulatory)
        if (len(section['section_text']) < MIN_SECTION_LENGTH and
            section['hierarchy_level'] > 1 and
            section['section_number'] not in ['INTRO', 'REGULATORY']):
            continue

        # Clean section text
        section['section_text'] = section['section_text'].strip()

        # Make sure section has an ID
        if 'section_id' not in section or not section['section_id']:
            section['section_id'] = str(uuid.uuid4())

        cleaned_sections.append(section)

    return cleaned_sections

def main():
    parser = argparse.ArgumentParser(description='Process EPA Federal Register document into structured sections with proper intro handling')
    parser.add_argument('input_file', help='Path to the markdown file to process')
    parser.add_argument('--output', '-o', help='Output JSON file path', default='processed/epa_document_sections_fixed.json')

    args = parser.parse_args()

    # Create output directory if it doesn't exist
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Read the markdown file
    with open(args.input_file, 'r', encoding='utf-8') as f:
        markdown_text = f.read()

    # Extract sections using the fixed EPA-specific extractor
    sections = extract_epa_sections_fixed(markdown_text)

    # Clean and optimize sections
    cleaned_sections = clean_sections(sections)

    # Save to JSON
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(cleaned_sections, f, indent=2)

    print(f"Processed {len(cleaned_sections)} sections from EPA document")
    print(f"Output saved to {args.output}")

    # Print hierarchy level summary
    level_counts = {}
    for section in cleaned_sections:
        level = section['hierarchy_level']
        level_counts[level] = level_counts.get(level, 0) + 1

    print("\nSection hierarchy summary:")
    for level, count in sorted(level_counts.items()):
        if level == 0:
            print(f"Level {level} (Introduction): {count} sections")
        elif level == 1:
            print(f"Level {level} (Main sections): {count} sections")
        elif level == 2:
            print(f"Level {level} (Subsections): {count} sections")
        else:
            print(f"Level {level}: {count} sections")

    # Print section overview
    print("\nSection overview:")
    for section in cleaned_sections[:10]:  # Show first 10 sections
        level_indent = "  " * section['hierarchy_level']
        print(f"{level_indent}{section['section_number']}: {section['section_title'][:80]}...")

if __name__ == "__main__":
    main()