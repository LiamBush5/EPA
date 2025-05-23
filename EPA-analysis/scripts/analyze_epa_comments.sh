#!/bin/bash

# This script runs the comment_analyzer.py on the latest EPA comments file

# Find the most recent structured comments file
LATEST_FILE=$(ls -t output/epa_*_structured.json 2>/dev/null | head -1)

if [ -z "$LATEST_FILE" ]; then
    echo "Error: No structured JSON files found in output directory"
    exit 1
fi

echo "Found latest comments file: $LATEST_FILE"

# Run the analyzer
python src/analysis/comment_analyzer.py --input "$LATEST_FILE" --output "output/section_analysis_$(date +%Y%m%d_%H%M%S).json"

echo "Analysis complete!"