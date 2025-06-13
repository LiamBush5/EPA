# EPA Comment Analysis System

This system analyzes EPA comments and matches them to relevant sections of legal documents using vector embeddings stored in Supabase.

## Overview

The system consists of several Python scripts that:

1. **Scrape** EPA comments and attachments from regulations.gov
2. **Process** PDF attachments from EPA comments
3. **Extract** sections from legal documents
4. **Generate** vector embeddings for comments and document sections
5. **Store** data in Supabase with pgvector
6. **Match** comments to document sections using vector similarity search

## Setup Instructions

### 1. Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` to add your API keys:
   - Add your OpenAI API key for embeddings
   - Add your Supabase URL and service key

3. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```

### 2. Database Schema

Create these tables in your Supabase project:

#### EPA Comments Table
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

#### Document Sections Table
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

#### Comment-Section Matches Table
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

## Usage Instructions (Run in Order)

### Step 1: Scrape EPA Comments
First, scrape comments from regulations.gov:
```bash
python 1_scrape_epa_comments.py
```

### Step 2: Process Comment Attachments
Download and extract text from PDF attachments:
```bash
python 2_process_attachments.py
```

### Step 3: Extract Document Sections
Process the legal document PDF into structured sections:
```bash
python 3_extract_document_sections.py
```

### Step 4: Upload to Database
Upload comments and sections to Supabase with embeddings:
```bash
python 4_upload_to_database.py
```

### Step 5: Match Comments to Sections
Perform vector similarity matching:
```bash
python 5_match_comments_to_sections.py
```

### Step 6: Generate Analysis Reports
Create formatted analysis reports:
```bash
python 6_generate_reports.py
```

## File Structure

```
EPA-analysis/
├── README.md                           # This file
├── requirements.txt                    # Python dependencies
├── .env.example                       # Environment variables template
├── .gitignore                         # Git ignore rules
│
├── scripts/                           # Main processing scripts (run in order)
│   ├── 1_scrape_epa_comments.py      # Scrape comments from regulations.gov
│   ├── 2_process_attachments.py      # Download and process PDF attachments
│   ├── 3_extract_document_sections.py # Extract sections from legal documents
│   ├── 4_upload_to_database.py       # Upload data to Supabase
│   ├── 5_match_comments_to_sections.py # Match comments to sections
│   └── 6_generate_reports.py         # Generate analysis reports
│
├── data/                              # Input data and documents
│   ├── raw/                          # Raw scraped data
│   ├── documents/                    # Legal documents (PDFs)
│   └── attachments/                  # Downloaded PDF attachments
│
├── processed/                         # Processed data files
│   ├── comments_with_attachments.json # Comments enhanced with attachment text
│   ├── document_sections.json        # Extracted document sections
│   └── comment_section_matches.json  # Matching results
│
└── output/                           # Final analysis results
    ├── analysis_summary.txt          # Summary of analysis results
    ├── comments_by_section.txt       # Comments organized by section
    └── section_statistics.json       # Statistics about comment distribution
```

## System Components

1. **1_scrape_epa_comments.py**
   - Scrapes comments from regulations.gov
   - Extracts comment metadata and text
   - Identifies attachments for download

2. **2_process_attachments.py**
   - Downloads PDF attachments referenced in comments
   - Extracts text from PDFs using PyPDF2
   - Enhances comment text with attachment content

3. **3_extract_document_sections.py**
   - Extracts text from legal document PDF
   - Splits document into logical sections
   - Identifies section hierarchy and relationships

4. **4_upload_to_database.py**
   - Uploads comments and sections to Supabase
   - Generates vector embeddings using OpenAI
   - Handles batching for efficient processing

5. **5_match_comments_to_sections.py**
   - Performs vector similarity search
   - Matches comments to relevant document sections
   - Stores match results with similarity scores

6. **6_generate_reports.py**
   - Creates formatted analysis reports
   - Organizes comments by document section
   - Generates summary statistics

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