# EPA Comments Scraper

A tool for scraping and analyzing public comments from regulations.gov, specifically designed for EPA rulemakings.

## Features

- Scrapes comments from EPA regulations.gov pages, including all comment pages
- Extracts full comment text and metadata for each comment
- Handles pagination to collect all comments
- Saves data in multiple formats (JSON, CSV, Excel)
- Configurable to limit the number of comments processed

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

3. Copy the example environment file and add your Firecrawl API key:
```bash
cp env.example .env
```
Then edit the `.env` file to add your Firecrawl API key.

## Usage

To scrape comments from the default EPA regulation:

```bash
python advanced_scraper.py
```

To scrape a specific regulation's comments:

```bash
python advanced_scraper.py --urls https://www.regulations.gov/document/EPA-HQ-XXXX-YYYY-ZZZZ/comment
```

To limit the number of comments processed (useful for testing):

```bash
python advanced_scraper.py --max-comments 10
```

To process all available comments:

```bash
python advanced_scraper.py --max-comments 0
```

## Output

The script generates the following output files in the `output` directory:

- `epa_[ID]_[TIMESTAMP]_raw.json` - Raw data from the main comments page
- `epa_[ID]_[TIMESTAMP].md` - Markdown content from the main comments page
- `epa_[ID]_[TIMESTAMP]_structured.json` - Structured data extracted from all comments
- `epa_[ID]_[TIMESTAMP].csv` - CSV export of the structured data
- `epa_[ID]_[TIMESTAMP].xlsx` - Excel export of the structured data

## License

MIT

## Disclaimer

This tool is for educational and research purposes only. Be sure to comply with the terms of service of regulations.gov when using this tool.