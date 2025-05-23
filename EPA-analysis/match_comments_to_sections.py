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

def build_section_hierarchy(sections):
    """Build a map of section hierarchy relationships"""
    # Create a map of section_id to its details
    section_map = {section['section_id']: section for section in sections}

    # Create parent-child relationships map
    parent_child_map = {}
    for section in sections:
        section_id = section['section_id']
        parent_id = section.get('parent_section_id')

        if parent_id:
            if parent_id not in parent_child_map:
                parent_child_map[parent_id] = []
            parent_child_map[parent_id].append(section_id)

    # Build a map of each section to all its ancestors
    ancestor_map = {}

    def get_ancestors(section_id):
        """Recursively get all ancestors for a section"""
        if section_id in ancestor_map:
            return ancestor_map[section_id]

        ancestors = []
        section = section_map.get(section_id)
        if not section:
            return []

        parent_id = section.get('parent_section_id')
        if parent_id:
            ancestors.append(parent_id)
            ancestors.extend(get_ancestors(parent_id))

        ancestor_map[section_id] = ancestors
        return ancestors

    # Populate ancestor map for all sections
    for section_id in section_map:
        if section_id not in ancestor_map:
            ancestor_map[section_id] = get_ancestors(section_id)

    return section_map, parent_child_map, ancestor_map

def filter_hierarchical_matches(matches, section_map, ancestor_map):
    """Filter matches to avoid parent-child redundancy"""
    # Group matches by comment
    comment_matches = {}
    for match in matches:
        comment_id = match['comment_id']
        if comment_id not in comment_matches:
            comment_matches[comment_id] = []
        comment_matches[comment_id].append(match)

    # Process each comment's matches
    filtered_matches = []
    for comment_id, matches in comment_matches.items():
        # Sort by similarity score (descending)
        sorted_matches = sorted(matches, key=lambda x: x['similarity_score'], reverse=True)

        # Keep track of which sections we've already covered
        covered_sections = set()

        for match in sorted_matches:
            section_id = match['section_id']

            # Skip if this section or any of its ancestors/descendants are already covered
            if section_id in covered_sections:
                continue

            # Get all ancestors of this section
            ancestors = ancestor_map.get(section_id, [])

            # If any ancestor is already covered, skip this match (unless this match is significantly better)
            should_skip = False
            for ancestor in ancestors:
                if ancestor in covered_sections:
                    # Check if this match is significantly better than the ancestor's match
                    # (e.g., at least 10% higher similarity)
                    ancestor_match = next((m for m in filtered_matches if
                                          m['comment_id'] == comment_id and
                                          m['section_id'] == ancestor), None)

                    if ancestor_match and match['similarity_score'] <= ancestor_match['similarity_score'] * 1.1:
                        should_skip = True
                        break

            if not should_skip:
                # Add this match
                filtered_matches.append(match)

                # Mark this section as covered
                covered_sections.add(section_id)

                # Also mark all ancestors as covered to avoid redundancy
                for ancestor in ancestors:
                    covered_sections.add(ancestor)

    return filtered_matches

def match_comments_to_sections(threshold=0.75, max_matches=5):
    """Match EPA comments to document sections based on vector similarity"""
    print("Fetching comments from Supabase...")
    comments_response = sb_client.table('epa_comments').select('*').execute()
    comments = comments_response.data

    print("Fetching document sections from Supabase...")
    sections_response = sb_client.table('document_sections').select('*').execute()
    sections = sections_response.data

    print(f"Matching {len(comments)} comments to {len(sections)} sections...")

    # Build section hierarchy maps
    print("Building section hierarchy maps...")
    section_map, parent_child_map, ancestor_map = build_section_hierarchy(sections)

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

    print(f"Found {len(all_matches)} raw comment-section matches above threshold {threshold}")

    # Filter matches to avoid parent-child redundancy
    filtered_matches = filter_hierarchical_matches(all_matches, section_map, ancestor_map)
    print(f"After hierarchical filtering: {len(filtered_matches)} unique matches")

    # Upload matches to Supabase
    upload_matches_to_supabase(filtered_matches)

    return filtered_matches

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