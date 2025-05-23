import os
import json
import requests
import PyPDF2
from io import BytesIO
import time
from tqdm import tqdm

def extract_pdf_text(pdf_content):
    """Extract text from PDF content"""
    try:
        pdf_file = BytesIO(pdf_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page_num in range(len(pdf_reader.pages)):
            text += pdf_reader.pages[page_num].extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error extracting text: {e}")
        return ""

def download_and_process_attachments():
    # Create directories
    os.makedirs('attachments', exist_ok=True)
    os.makedirs('processed', exist_ok=True)

    # Load the comment data
    input_file = 'Scraping/output/epa_EPA-HQ-OLEM-2017-0463-0001_20250522_172314_structured.json'
    output_file = 'processed/epa_comments_with_attachment_content.json'

    with open(input_file, 'r') as f:
        comments = json.load(f)

    # Track statistics
    total_attachments = 0
    processed_attachments = 0

    # Process each comment
    for comment in tqdm(comments, desc="Processing comments"):
        if not comment.get('attachments'):
            continue

        # Keep the original comment text unchanged
        original_text = comment['comment_text']

        # Create a new field for attachment contents
        comment['attachment_contents'] = []

        # Also maintain the combined text for vector search
        combined_text = original_text

        for attachment in comment['attachments']:
            total_attachments += 1
            link = attachment.get('link')
            if not link or not link.endswith('.pdf'):
                print(f"Skipping non-PDF attachment: {attachment.get('filename')}")
                attachment['extracted_text'] = ""
                comment['attachment_contents'].append({
                    'filename': attachment.get('filename', ''),
                    'text': ""
                })
                continue

            try:
                # Download the PDF
                print(f"Downloading {link}")
                response = requests.get(link)
                response.raise_for_status()

                # Save the PDF locally
                filename = f"attachments/{comment['comment_id']}_{attachment['filename'].replace(' ', '_')}.pdf"
                with open(filename, 'wb') as pdf_file:
                    pdf_file.write(response.content)

                # Extract text
                extracted_text = extract_pdf_text(response.content)

                if extracted_text:
                    # Store the extracted text with the attachment
                    attachment['extracted_text'] = extracted_text

                    # Add to attachment contents collection
                    comment['attachment_contents'].append({
                        'filename': attachment.get('filename', ''),
                        'text': extracted_text
                    })

                    # Add to combined text for vector search
                    combined_text += f"\n\n--- ATTACHMENT CONTENT: {attachment['filename']} ---\n\n"
                    combined_text += extracted_text

                    processed_attachments += 1
                    print(f"Added {len(extracted_text)} characters of text from {attachment['filename']}")
                else:
                    attachment['extracted_text'] = ""
                    comment['attachment_contents'].append({
                        'filename': attachment.get('filename', ''),
                        'text': ""
                    })

                # Be nice to the server
                time.sleep(1)

            except Exception as e:
                print(f"Error processing {link}: {e}")
                attachment['extracted_text'] = ""
                comment['attachment_contents'].append({
                    'filename': attachment.get('filename', ''),
                    'text': ""
                })

        # Store the combined text in a new field
        comment['combined_text'] = combined_text

    # Save the updated comments
    with open(output_file, 'w') as f:
        json.dump(comments, f, indent=2)

    print(f"Processed {processed_attachments} of {total_attachments} attachments")
    print(f"Enhanced comments saved to {output_file}")

if __name__ == "__main__":
    download_and_process_attachments()