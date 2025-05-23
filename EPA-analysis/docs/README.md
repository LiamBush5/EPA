# EPA Comment Analysis System Documentation

This system analyzes EPA comments and matches them to relevant sections of legal documents using vector embeddings stored in Supabase.

## Overview

The system consists of several Python scripts that:

1. Process PDF attachments from EPA comments
2. Extract sections from legal documents
3. Generate vector embeddings for comments and document sections
4. Store data in Supabase with pgvector
5. Match comments to document sections using vector similarity search

## Database Schema

Create these tables in your Supabase project:

### EPA Comments Table
```sql
CREATE TABLE epa_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id TEXT UNIQUE,
    commenter_name TEXT,
    comment_date DATE,
    organization TEXT,
    comment_text TEXT NOT NULL,
    attachment_contents JSONB, -- JSON array of attachment text contents
    combined_text TEXT, -- Combined comment text + attachment texts
    attachment_count INTEGER DEFAULT 0,
    source_url TEXT,
    has_attachments BOOLEAN DEFAULT FALSE,
    embedding vector(1536)
);

CREATE INDEX epa_comments_embedding_idx ON epa_comments USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### Document Sections Table
```sql
CREATE TABLE document_sections (
    section_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_number TEXT,
    section_title TEXT,
    section_text TEXT NOT NULL,
    parent_section_id UUID REFERENCES document_sections(id),
    hierarchy_level INTEGER,
    embedding vector(1536)
);

CREATE INDEX document_sections_embedding_idx ON document_sections USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### Comment-Section Matches Table
```sql
CREATE TABLE comment_section_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id TEXT REFERENCES epa_comments(comment_id),
    section_id UUID REFERENCES document_sections(section_id),
    similarity_score FLOAT,
    UNIQUE(comment_id, section_id)
);

CREATE INDEX comment_section_matches_comment_id_idx ON comment_section_matches(comment_id);
CREATE INDEX comment_section_matches_section_id_idx ON comment_section_matches(section_id);
```

## Usage Instructions

### Step 1: Process Comments with Attachments

This script downloads and extracts text from PDF attachments, adding the content to the comment text.

```bash
python src/processing/process_attachments.py
```

### Step 2: Extract Document Sections

This script processes a legal document (PDF) into sections:

```bash
python src/processing/process_legal_document.py
```

### Step 3: Load Comments to Supabase

This script uploads comments to Supabase and generates embeddings:

```bash
python src/db/supabase_comment_loader.py
```

### Step 4: Match Comments to Document Sections

This script performs vector similarity search to match comments to relevant document sections:

```bash
python src/analysis/match_comments_to_sections.py
```

## System Components

1. **process_attachments.py**
   - Downloads PDF attachments referenced in comments
   - Extracts text from PDFs
   - Enhances comment text with attachment content
   - Outputs enhanced comments JSON

2. **process_legal_document.py**
   - Extracts text from legal document PDF
   - Splits document into logical sections
   - Identifies section hierarchy
   - Outputs structured document sections JSON

3. **supabase_comment_loader.py**
   - Uploads comments to Supabase
   - Generates vector embeddings for comment text
   - Handles batching for efficient processing

4. **match_comments_to_sections.py**
   - Matches comments to document sections using vector similarity
   - Stores matches in the database
   - Generates match report with statistics

5. **comment_analyzer.py**
   - Analyzes comments for key themes and sentiments
   - Generates summary reports

6. **reformat_by_section.py**
   - Reorganizes analysis results by document section
   - Generates formatted output files

7. **view_results.py**
   - Provides a simple interface to view analysis results

## Query Examples

### Find all comments related to a specific section:

```sql
SELECT c.commenter_name, c.comment_date, c.comment_text
FROM epa_comments c
JOIN comment_section_matches m ON c.comment_id = m.comment_id
JOIN document_sections s ON m.section_id = s.section_id
WHERE s.section_number = 'II.A'
ORDER BY m.similarity_score DESC;
```

### Find sections most frequently commented on:

```sql
SELECT s.section_number, s.section_title, COUNT(m.id) as comment_count
FROM document_sections s
JOIN comment_section_matches m ON s.section_id = m.section_id
GROUP BY s.section_id, s.section_number, s.section_title
ORDER BY comment_count DESC;
```

### Find comments with strongest match to any section:

```sql
SELECT c.commenter_name, c.organization, s.section_number,
       s.section_title, m.similarity_score
FROM comment_section_matches m
JOIN epa_comments c ON m.comment_id = c.comment_id
JOIN document_sections s ON m.section_id = s.section_id
ORDER BY m.similarity_score DESC
LIMIT 20;
```