import os
import re
import uuid
import json
import PyPDF2
from io import BytesIO
import openai
from dotenv import load_dotenv
import argparse
from pathlib import Path

# Load environment variables
load_dotenv()

# Setup OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

def extract_pdf_text(pdf_path):
    """Extract text from PDF file"""
    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        text = ""
        for page_num in range(len(pdf_reader.pages)):
            text += pdf_reader.pages[page_num].extract_text() + "\n"
        return text

def split_into_sections(text):
    """Split the document text into hierarchical sections"""
    # First attempt using regex pattern matching to identify section headers
    sections = []

    # Extract potential sections with roman numerals (I., II., III., etc.)
    roman_pattern = r'(?m)^((?:I|V|X|L|C|D|M)+\.)\s+([A-Z].*?)(?=\n(?:I|V|X|L|C|D|M)+\.|$)'
    roman_sections = re.findall(roman_pattern, text, re.DOTALL)

    # Extract potential sections with arabic numerals (1., 2., 3., etc.)
    arabic_pattern = r'(?m)^(\d+\.)\s+([A-Z].*?)(?=\n\d+\.|$)'
    arabic_sections = re.findall(arabic_pattern, text, re.DOTALL)

    # Extract potential subsections (A., B., C., etc.)
    alpha_pattern = r'(?m)^([A-Z]\.)\s+(.*?)(?=\n[A-Z]\.|$)'
    alpha_sections = re.findall(alpha_pattern, text, re.DOTALL)

    # Process Roman numeral sections (highest level)
    parent_map = {}
    for num, content in roman_sections:
        section_id = str(uuid.uuid4())
        section = {
            'section_id': section_id,
            'section_number': num.strip(),
            'section_title': content.strip().split('\n')[0],
            'section_text': content.strip(),
            'parent_section_id': None,
            'hierarchy_level': 1
        }
        sections.append(section)
        parent_map[num.strip()] = section_id

    # Process Arabic numeral sections (second level)
    for num, content in arabic_sections:
        # Find parent by looking at previous content
        parent_id = None
        for parent_num, parent_id in parent_map.items():
            if parent_num in text[:text.find(num)]:
                break

        section_id = str(uuid.uuid4())
        section = {
            'section_id': section_id,
            'section_number': num.strip(),
            'section_title': content.strip().split('\n')[0],
            'section_text': content.strip(),
            'parent_section_id': parent_id,
            'hierarchy_level': 2
        }
        sections.append(section)
        parent_map[num.strip()] = section_id

    # If the automatic section splitting didn't work well,
    # fallback to a simpler approach of splitting by paragraphs
    if len(sections) < 5:
        sections = []
        paragraphs = re.split(r'\n\s*\n', text)

        for i, para in enumerate(paragraphs):
            if len(para.strip()) > 50:  # Only include substantial paragraphs
                section_id = str(uuid.uuid4())
                section = {
                    'section_id': section_id,
                    'section_number': f"P{i+1}",
                    'section_title': para.strip().split('\n')[0][:50] + "..." if len(para.strip().split('\n')[0]) > 50 else para.strip().split('\n')[0],
                    'section_text': para.strip(),
                    'parent_section_id': None,
                    'hierarchy_level': 1
                }
                sections.append(section)

    return sections

def use_gpt_for_sectioning(text):
    """Use GPT model to identify document sections with hierarchy"""
    # For large documents, we need to split into chunks
    MAX_CHUNK_SIZE = 4000
    chunks = [text[i:i+MAX_CHUNK_SIZE] for i in range(0, len(text), MAX_CHUNK_SIZE)]

    all_sections = []

    for i, chunk in enumerate(chunks):
        prompt = f"""
        You're going to help me identify sections in a legal document. Here's chunk {i+1} of the document.

        Please identify any clear sections, subsections and their hierarchy. Format your response as JSON with the following structure:
        [
            {{
                "section_number": "The section number/identifier if present",
                "section_title": "The section title",
                "section_text": "The full section text",
                "hierarchy_level": "Numeric level in hierarchy (1 for top, 2 for subsections, etc.)",
                "parent_section": "The parent section number (null for top level)"
            }}
        ]

        Only output valid JSON without any explanation or additional text.

        Document chunk:
        {chunk}
        """

        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that identifies sections in legal documents."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1500
            )

            result = response.choices[0].message.content.strip()
            # Extract the JSON portion
            json_match = re.search(r'\[.*\]', result, re.DOTALL)
            if json_match:
                chunk_sections = json.loads(json_match.group(0))
                all_sections.extend(chunk_sections)
            else:
                print(f"Couldn't extract JSON from chunk {i+1}")
        except Exception as e:
            print(f"Error processing chunk {i+1}: {e}")

    # Assign UUIDs and fix parent references
    section_map = {}
    final_sections = []

    for section in all_sections:
        section_id = str(uuid.uuid4())
        section_map[section.get('section_number', '')] = section_id

        final_section = {
            'section_id': section_id,
            'section_number': section.get('section_number', ''),
            'section_title': section.get('section_title', ''),
            'section_text': section.get('section_text', ''),
            'parent_section_id': None,  # Will update in second pass
            'hierarchy_level': section.get('hierarchy_level', 1)
        }
        final_sections.append(final_section)

    # Second pass to update parent IDs
    for section in final_sections:
        parent = next((s for s in all_sections if s.get('section_number') == section.get('parent_section')), None)
        if parent:
            section['parent_section_id'] = section_map.get(parent.get('section_number', ''))

    return final_sections

def process_document(pdf_path, output_path):
    """Process legal document into sections and save to JSON"""
    print(f"Extracting text from {pdf_path}...")
    text = extract_pdf_text(pdf_path)

    print("Splitting into sections...")
    sections = split_into_sections(text)

    # If automatic sectioning didn't work well, try using GPT
    if len(sections) < 10:
        print("Using GPT to identify sections...")
        sections = use_gpt_for_sectioning(text)

    print(f"Found {len(sections)} sections")

    # Save sections to JSON file
    with open(output_path, 'w') as f:
        json.dump(sections, f, indent=2)

    print(f"Sections saved to {output_path}")
    return sections

def extract_sections(markdown_text):
    """
    Extract sections from markdown text based on headers and organize them hierarchically.
    """
    # Regular expressions for different heading levels
    h1_pattern = r'^# ([^\n]+)'
    h2_pattern = r'^## ([^\n]+)'
    h3_pattern = r'^### ([^\n]+)'
    h4_pattern = r'^# ([IVXLCDM]+)\. ([^\n]+)'  # Roman numerals (I. General Information)
    h5_pattern = r'^# ([A-Z])\. ([^\n]+)'  # Letter headers (A. Does this action apply to me?)

    # Split the markdown by page separators
    pages = re.split(r'---\n', markdown_text)

    # Concatenate pages and normalize line endings
    text = '\n'.join(pages)
    text = re.sub(r'\r\n', '\n', text)

    # Split content by headers to identify sections
    lines = text.split('\n')
    sections = []
    current_section = None
    current_text = []

    section_stack = []  # For tracking hierarchy

    for line in lines:
        # Check if line is a header
        h4_match = re.match(h4_pattern, line)
        h5_match = re.match(h5_pattern, line)
        h1_match = re.match(h1_pattern, line)
        h2_match = re.match(h2_pattern, line)
        h3_match = re.match(h3_pattern, line)

        if h4_match or h5_match or h1_match or h2_match or h3_match:
            # Save previous section if exists
            if current_section:
                current_section['section_text'] = '\n'.join(current_text).strip()
                sections.append(current_section)

            # Determine section level and title
            if h4_match:  # Roman numeral headers (I., II., etc.)
                level = 1
                section_number = h4_match.group(1)
                title = h4_match.group(2)
                section_stack = [section_number]
            elif h5_match:  # Letter headers (A., B., etc.)
                level = 2
                section_number = h5_match.group(1)
                title = h5_match.group(2)
                if len(section_stack) >= 1:
                    section_stack = section_stack[:1] + [section_number]
                else:
                    section_stack = [section_number]
            elif h1_match:
                level = 1
                section_number = ""
                title = h1_match.group(1)
                section_stack = [title[:10]]  # Use abbreviated title as identifier
            elif h2_match:
                level = 2
                section_number = ""
                title = h2_match.group(1)
                if len(section_stack) >= 1:
                    section_stack = section_stack[:1] + [title[:10]]
                else:
                    section_stack = [title[:10]]
            elif h3_match:
                level = 3
                section_number = ""
                title = h3_match.group(1)
                if len(section_stack) >= 2:
                    section_stack = section_stack[:2] + [title[:10]]
                else:
                    section_stack = section_stack + [title[:10]]

            # Create new section
            current_section = {
                'section_id': str(uuid.uuid4()),
                'section_number': section_number,
                'section_title': title.strip(),
                'hierarchy_level': level,
                'hierarchy_path': '.'.join(section_stack),
                'parent_section_id': None  # Will be filled in later
            }
            current_text = [line]  # Include the header in the section text
        else:
            if current_section:
                current_text.append(line)
            else:
                # Handle text before any section headers
                if line.strip():
                    if not sections:
                        # Create an initial section if needed
                        current_section = {
                            'section_id': str(uuid.uuid4()),
                            'section_number': '',
                            'section_title': 'Introduction',
                            'hierarchy_level': 0,
                            'hierarchy_path': 'intro',
                            'parent_section_id': None
                        }
                        current_text = [line]
                    else:
                        # Add to the last section
                        sections[-1]['section_text'] += '\n' + line

    # Don't forget the last section
    if current_section:
        current_section['section_text'] = '\n'.join(current_text).strip()
        sections.append(current_section)

    # Now establish parent-child relationships
    for i, section in enumerate(sections):
        # Skip the first section (assumed to be top-level)
        if i == 0:
            continue

        # Get the current section's level
        current_level = section['hierarchy_level']

        # Look backwards to find the parent
        for j in range(i-1, -1, -1):
            potential_parent = sections[j]
            if potential_parent['hierarchy_level'] < current_level:
                section['parent_section_id'] = potential_parent['section_id']
                break

    return sections

def clean_sections(sections):
    """
    Clean up sections by removing very short sections and merging closely related ones.
    """
    MIN_SECTION_LENGTH = 100  # Minimum character length for a section

    cleaned_sections = []
    for section in sections:
        # Skip extremely short sections
        if len(section['section_text']) < MIN_SECTION_LENGTH and section['hierarchy_level'] > 1:
            continue

        # Clean section text
        section['section_text'] = section['section_text'].strip()

        # Make sure section has an ID
        if 'section_id' not in section or not section['section_id']:
            section['section_id'] = str(uuid.uuid4())

        cleaned_sections.append(section)

    return cleaned_sections

def main():
    parser = argparse.ArgumentParser(description='Process legal document into structured sections')
    parser.add_argument('input_file', help='Path to the markdown file to process')
    parser.add_argument('--output', '-o', help='Output JSON file path', default='processed/document_sections.json')

    args = parser.parse_args()

    # Create output directory if it doesn't exist
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Read the markdown file
    with open(args.input_file, 'r', encoding='utf-8') as f:
        markdown_text = f.read()

    # Extract sections
    sections = extract_sections(markdown_text)

    # Clean and optimize sections
    cleaned_sections = clean_sections(sections)

    # Save to JSON
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(cleaned_sections, f, indent=2)

    print(f"Processed {len(cleaned_sections)} sections from document")
    print(f"Output saved to {args.output}")

    # Print hierarchy level summary
    level_counts = {}
    for section in cleaned_sections:
        level = section['hierarchy_level']
        level_counts[level] = level_counts.get(level, 0) + 1

    print("\nSection hierarchy summary:")
    for level, count in sorted(level_counts.items()):
        print(f"Level {level}: {count} sections")

if __name__ == "__main__":
    main()