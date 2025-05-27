import os
import json
import openai
import numpy as np
import supabase
from dotenv import load_dotenv
from tqdm import tqdm

# Load environment variables
load_dotenv()

# Setup OpenAI and Supabase clients
openai.api_key = os.getenv('OPENAI_API_KEY')
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
sb_client = supabase.create_client(supabase_url, supabase_key)

def get_embedding(text):
    """Generate embedding vector for text using OpenAI's embedding API"""
    if not text.strip():
        return []

    # Be more aggressive with truncation - 1 token is roughly 4 chars for English text
    # Using 7000 tokens (instead of 8192) to be safe
    max_tokens = 7000
    max_chars = max_tokens * 4

    if len(text) > max_chars:
        # Truncate text to avoid exceeding token limit
        text = text[:max_chars]
        # Further ensure we're within limits by truncating at the last complete sentence
        last_period = text.rfind('.')
        if last_period > max_chars * 0.8:  # If we find a period in the last 20% of the text
            text = text[:last_period + 1]

    try:
        response = openai.Embedding.create(
            input=text,
            model="text-embedding-ada-002"
        )
        return response['data'][0]['embedding']
    except openai.error.InvalidRequestError as e:
        # If we still hit token limits, truncate more aggressively
        if "maximum context length" in str(e):
            print(f"Warning: Text still too long, truncating more aggressively")
            # Try with half the text
            return get_embedding(text[:len(text)//2])
        else:
            # Re-raise if it's a different error
            raise

def upsert_documents_to_supabase(documents, batch_size=10):
    """Insert documents into Supabase with embeddings"""
    for i in tqdm(range(0, len(documents), batch_size), desc="Uploading batches to Supabase"):
        batch = documents[i:i+batch_size]

        # Prepare batch data
        rows = []
        for doc in batch:
            # Use combined_text for embedding if available, otherwise use comment_text
            text_for_embedding = doc.get('combined_text', doc['comment_text'])
            embedding = get_embedding(text_for_embedding)

            # Prepare row data
            row = {
                'comment_id': doc['comment_id'],
                'commenter_name': doc['commenter_name'],
                'organization': doc.get('organization', ''),
                'comment_date': doc['comment_date'],
                'comment_text': doc['comment_text'],
                'has_attachments': len(doc.get('attachments', [])) > 0,
                'attachment_count': len(doc.get('attachment_contents', [])),
                'attachment_contents': json.dumps(doc.get('attachment_contents', [])),
                'combined_text': doc.get('combined_text', doc['comment_text']),
                'source_url': doc.get('source_url', ''),
                'embedding': embedding
            }
            rows.append(row)

        # Upsert batch to Supabase
        try:
            result = sb_client.table('epa_comments').upsert(rows).execute()
            if hasattr(result, 'error') and result.error:
                print(f"Error uploading batch: {result.error}")
        except Exception as e:
            print(f"Error uploading batch: {e}")

def insert_document_sections(sections, batch_size=10):
    """Insert document sections into Supabase with embeddings"""
    for i in tqdm(range(0, len(sections), batch_size), desc="Uploading section batches to Supabase"):
        batch = sections[i:i+batch_size]

        # Prepare batch data
        rows = []
        for section in batch:
            embedding = get_embedding(section['section_text'])

            # Prepare row data
            row = {
                'section_id': section['section_id'],
                'section_number': section.get('section_number', ''),
                'section_title': section.get('section_title', ''),
                'section_text': section['section_text'],
                'parent_section_id': section.get('parent_section_id'),
                'hierarchy_level': section.get('hierarchy_level', 1),
                'hierarchy_path': section.get('hierarchy_path', '')
            }

            # Only add embedding if it's not empty
            if embedding:
                row['embedding'] = embedding

            rows.append(row)

        # Upsert batch to Supabase
        try:
            result = sb_client.table('document_sections').upsert(rows).execute()
            if hasattr(result, 'error') and result.error:
                print(f"Error uploading batch: {result.error}")
        except Exception as e:
            print(f"Error uploading batch: {e}")

def load_document_sections():
    """Load document sections from JSON file and upload to Supabase"""
    sections_file = 'output/epa_sections_with_intro.json'
    print(f"Loading document sections from {sections_file}")

    try:
        with open(sections_file, 'r') as f:
            sections = json.load(f)

        print(f"Found {len(sections)} document sections to load")

        # Upload sections to Supabase
        insert_document_sections(sections)

        print("Document sections uploaded successfully!")
        return True
    except FileNotFoundError:
        print(f"Document sections file not found: {sections_file}")
        return False
    except Exception as e:
        print(f"Error loading document sections: {e}")
        return False

def main():
    print("Welcome to the EPA comment and document loader")
    print("1. Load document sections")
    print("2. Load comments")
    print("3. Load both document sections and comments")
    print("4. Exit")

    choice = input("Enter your choice (1-4): ")

    if choice == '1':
        load_document_sections()
    elif choice == '2':
        # Load the enhanced comments with attachment content
        comments_file = 'processed/epa_comments_with_attachment_content.json'
        print(f"Loading comments from {comments_file}")

        with open(comments_file, 'r') as f:
            comments = json.load(f)

        print(f"Found {len(comments)} comments to load")

        # Count comments with attachments
        comments_with_attachments = sum(1 for c in comments if len(c.get('attachment_contents', [])) > 0)
        print(f"Of these, {comments_with_attachments} comments have attachments")

        # Upload comments to Supabase
        upsert_documents_to_supabase(comments)

        print("Comments uploaded successfully!")
    elif choice == '3':
        success = load_document_sections()
        if success:
            # Load comments after sections are loaded
            comments_file = 'processed/epa_comments_with_attachment_content.json'
            print(f"Loading comments from {comments_file}")

            with open(comments_file, 'r') as f:
                comments = json.load(f)

            print(f"Found {len(comments)} comments to load")

            # Count comments with attachments
            comments_with_attachments = sum(1 for c in comments if len(c.get('attachment_contents', [])) > 0)
            print(f"Of these, {comments_with_attachments} comments have attachments")

            # Upload comments to Supabase
            upsert_documents_to_supabase(comments)

            print("Comments uploaded successfully!")
    elif choice == '4':
        print("Exiting...")
    else:
        print("Invalid choice. Exiting...")

if __name__ == "__main__":
    main()