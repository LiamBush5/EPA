# EPA Comment Section Analyzer

This tool analyzes EPA comments to identify which sections of regulatory documents they are addressing.

## Features

- Uses OpenAI's GPT models to analyze comment content
- Maps comments to specific sections of EPA regulatory documents
- Outputs results in a readable format and optionally saves to JSON

## Installation

1. Clone this repository:
```bash
git clone https://github.com/LiamBush5/EPA.git
cd EPA
```

2. Install the required dependencies:
```bash
pip install -r requirements.txt
```

3. Copy the example environment file and add your OpenAI API key:
```bash
cp env.example .env
```
Then edit the `.env` file to add your OpenAI API key.

## Usage

Run the analyzer on your comments JSON file:

```bash
python comment_analyzer.py --input output/your_comments_file.json --output analysis_results.json
```

### Parameters

- `--input`, `-i`: (Required) Input JSON file with comments
- `--output`, `-o`: (Optional) Output JSON file for analysis results
- `--api-key`: (Optional) OpenAI API key (defaults to OPENAI_API_KEY env var)

## Output Format

For each comment, the tool will print an analysis like:

```
==================================================
✅ Comment: EPA-HQ-OLEM-2017-0463-0036
From: Comment submitted by Colorado Department of Public Health and Environment

Relevant to:
Section IV.B.2: Proposed Requirements for Puncturing and Draining
Section VI: Requests for Comment – Worker Safety and SOP Re
==================================================
```

Results are also saved to the specified output file in JSON format.

## License

[MIT](LICENSE)