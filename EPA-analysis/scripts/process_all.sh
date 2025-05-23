#!/bin/bash

# This script runs the entire EPA comment analysis pipeline

echo "Starting EPA comment analysis pipeline..."

# Step 1: Process attachments
echo "Step 1: Processing attachments..."
python src/processing/process_attachments.py

# Step 2: Process legal document
echo "Step 2: Processing legal document..."
python src/processing/process_legal_document.py

# Step 3: Load comments to Supabase
echo "Step 3: Loading comments to Supabase..."
python src/db/supabase_comment_loader.py

# Step 4: Match comments to sections
echo "Step 4: Matching comments to sections..."
python src/analysis/match_comments_to_sections.py

# Step 5: Analyze comments
echo "Step 5: Analyzing comments..."
python src/analysis/comment_analyzer.py

# Step 6: Reformat by section
echo "Step 6: Reformatting by section..."
python src/analysis/reformat_by_section.py

echo "Pipeline complete! Results are available in the output directory."
echo "Run 'python src/analysis/view_results.py' to view the results interactively."