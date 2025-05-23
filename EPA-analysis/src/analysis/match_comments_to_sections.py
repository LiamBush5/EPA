import os
import json
import supabase
import numpy as np
from dotenv import load_dotenv
from tqdm import tqdm

# Load environment variables
load_dotenv()

# Setup Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
sb_client = supabase.create_client(supabase_url, supabase_key)

def vector_search_similarity(comment_embedding, section_embedding):
    """Calculate cosine similarity between two embedding vectors"""
    if not comment_embedding or not section_embedding:
        return 0.0

    # Check if embeddings are strings (from database) and convert to lists
    if isinstance(comment_embedding, str):
        try:
            # Try parsing as a JSON string
            comment_embedding = json.loads(comment_embedding)
        except:
            # If not JSON, try parsing as a string representation of a list
            comment_embedding = comment_embedding.strip('[]').split(',')
            comment_embedding = [float(x.strip()) for x in comment_embedding if x.strip()]

    if isinstance(section_embedding, str):
        try:
            # Try parsing as a JSON string
            section_embedding = json.loads(section_embedding)
        except:
            # If not JSON, try parsing as a string representation of a list
            section_embedding = section_embedding.strip('[]').split(',')
            section_embedding = [float(x.strip()) for x in section_embedding if x.strip()]

    # Convert to numpy arrays
    vec1 = np.array(comment_embedding, dtype=np.float32)
    vec2 = np.array(section_embedding, dtype=np.float32)

    # Calculate cosine similarity
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)

    if norm1 == 0 or norm2 == 0:
        return 0.0

    return dot_product / (norm1 * norm2)

def match_comments_to_sections(threshold=0.75, max_matches=5):
    """Match EPA comments to document sections based on vector similarity"""
    print("Fetching comments from Supabase...")
    comments_response = sb_client.table('epa_comments').select('*').execute()
    comments = comments_response.data

    print("Fetching document sections from Supabase...")
    sections_response = sb_client.table('document_sections').select('*').execute()
    sections = sections_response.data

    print(f"Matching {len(comments)} comments to {len(sections)} sections...")

    # Create a list to store matches
    all_matches = []

    # Process each comment
    for comment in tqdm(comments, desc="Processing comments"):
        # Use the string comment_id field (not the UUID id field)
        comment_str_id = comment['comment_id']
        comment_embedding = comment['embedding']

        # Find matching sections
        section_matches = []
        for section in sections:
            section_id = section['section_id']
            section_title = section.get('section_title', '')
            section_number = section.get('section_number', '')
            section_embedding = section['embedding']

            # Calculate similarity
            similarity = vector_search_similarity(comment_embedding, section_embedding)

            # If similarity is above threshold, add to matches
            if similarity >= threshold:
                section_matches.append({
                    'section_id': section_id,
                    'section_title': section_title,
                    'section_number': section_number,
                    'similarity_score': float(similarity)
                })

        # Sort matches by similarity score (descending)
        section_matches.sort(key=lambda x: x['similarity_score'], reverse=True)

        # Take top N matches
        top_matches = section_matches[:max_matches]

        # Add to results
        for match in top_matches:
            all_matches.append({
                'comment_id': comment_str_id,  # Use string comment ID for foreign key
                'section_id': match['section_id'],
                'similarity_score': match['similarity_score']
            })

    print(f"Found {len(all_matches)} comment-section matches above threshold {threshold}")

    # Upload matches to Supabase
    upload_matches_to_supabase(all_matches)

    return all_matches

def upload_matches_to_supabase(matches, batch_size=50):
    """Upload comment-section matches to Supabase"""
    print(f"Uploading {len(matches)} matches to Supabase...")

    # First, clear any existing matches
    try:
        sb_client.table('comment_section_matches').delete().neq('comment_id', 'NO_MATCH_DUMMY_VALUE').execute()
        print("Deleted existing matches")
    except Exception as e:
        print(f"Error deleting existing matches: {e}")

    # Process in batches
    for i in tqdm(range(0, len(matches), batch_size), desc="Uploading match batches"):
        batch = matches[i:i+batch_size]

        try:
            # Insert batch to Supabase
            result = sb_client.table('comment_section_matches').insert(batch).execute()

            # Check for errors
            if hasattr(result, 'error') and result.error:
                print(f"Error uploading batch: {result.error}")
        except Exception as e:
            print(f"Error uploading batch: {e}")

    print("All matches uploaded successfully!")

def analyze_match_results():
    """Analyze the matching results"""
    # Get count of matches
    match_count_response = sb_client.table('comment_section_matches').select('*', count='exact').execute()
    total_matches = match_count_response.count

    # Get distinct comment count
    distinct_comments = set()
    all_matches_response = sb_client.table('comment_section_matches').select('*').execute()

    # Print debug info
    if all_matches_response.data and len(all_matches_response.data) > 0:
        print(f"Sample match data: {all_matches_response.data[0]}")

    for match in all_matches_response.data:
        if 'comment_id' in match:
            distinct_comments.add(match['comment_id'])

    print(f"Total matches: {total_matches}")
    print(f"Comments with matches: {len(distinct_comments)}")

    # Count matches per section manually
    section_counts = {}
    section_info = {}

    # Get all sections for lookup
    all_sections_response = sb_client.table('document_sections').select('section_id,section_number,section_title').execute()
    for section in all_sections_response.data:
        section_info[section['section_id']] = {
            'section_number': section.get('section_number', 'N/A'),
            'section_title': section.get('section_title', 'Untitled')
        }

    # Count matches per section - safely access fields
    for match in all_matches_response.data:
        if 'section_id' in match:
            section_id = match['section_id']
            if section_id not in section_counts:
                section_counts[section_id] = 0
            section_counts[section_id] += 1

    # Sort sections by match count
    sorted_sections = sorted(section_counts.items(), key=lambda x: x[1], reverse=True)

    # Print top 10 sections
    print("\nTop 10 Sections by Comment Count:")
    for i, (section_id, count) in enumerate(sorted_sections[:10], 1):
        info = section_info.get(section_id, {'section_number': 'Unknown', 'section_title': 'Unknown'})
        print(f"{i}. {info['section_number']} {info['section_title']}: {count} comments")

if __name__ == "__main__":
    # Match comments to sections
    matches = match_comments_to_sections(threshold=0.70)

    # Analyze results
    analyze_match_results()