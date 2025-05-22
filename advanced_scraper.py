#!/usr/bin/env python3
import os
import json
import argparse
import pandas as pd
from datetime import datetime
from tqdm import tqdm
from dotenv import load_dotenv
from firecrawl import FirecrawlApp
from bs4 import BeautifulSoup

# Load environment variables from .env file
load_dotenv()

class EPACommentScraper:
    """Class to scrape and process EPA comments from regulations.gov"""

    def __init__(self, api_key=None, output_dir="output"):
        """
        Initialize the scraper

        Args:
            api_key: Firecrawl API key (defaults to FIRECRAWL_API_KEY env var)
            output_dir: Directory to store output files
        """
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

        # Get API key from parameter or environment
        self.api_key = api_key or os.environ.get("FIRECRAWL_API_KEY")
        if not self.api_key:
            raise ValueError("Firecrawl API key not provided and FIRECRAWL_API_KEY not found in environment")

        # Initialize Firecrawl client
        self.app = FirecrawlApp(api_key=self.api_key)

        # Generate timestamp for file naming
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    def scrape_single_url(self, url, wait_time=5000):
        """
        Scrape a single URL and return the raw result

        Args:
            url: The URL to scrape
            wait_time: Time to wait for dynamic content (ms)

        Returns:
            The raw scraping result
        """
        print(f"Scraping: {url}")
        result = self.app.scrape_url(
            url=url,
            formats=["markdown", "html"],
            wait_for=wait_time
        )
        return result

    def extract_structured_data(self, url, max_comments=None):
        """
        Extract structured comment data from a URL

        Args:
            url: The URL to extract data from
            max_comments: Maximum number of comments to process (None for all)

        Returns:
            Structured data as a dictionary or list
        """
        print(f"Extracting structured data from: {url}")

        # Remove any existing page number parameter
        base_url = url.split('?')[0]

        # Store all comment links across all pages
        all_comment_links = []
        current_page = 1
        more_pages = True

        # Iterate through all pages
        while more_pages:
            page_url = f"{base_url}?pageNumber={current_page}"
            print(f"Processing page {current_page}: {page_url}")

            # Get the current page
            try:
                main_page = self.app.scrape_url(
                    url=page_url,
                    formats=["markdown", "html"],
                    wait_for=5000
                )

                # Extract comment links from this page
                page_comment_links = []
                if hasattr(main_page, "html"):
                    soup = BeautifulSoup(main_page.html, 'html.parser')

                    # Look for comment links
                    for link in soup.find_all('a', href=True):
                        if '/comment/EPA-' in link['href']:
                            # Fix URL format to ensure it's properly formed
                            if link['href'].startswith('/'):
                                full_url = f"https://www.regulations.gov{link['href']}"
                            else:
                                full_url = link['href']

                            # Ensure we don't have duplicate URLs
                            if full_url not in page_comment_links and full_url not in all_comment_links:
                                page_comment_links.append(full_url)

                # If we found links, add them to our master list
                if page_comment_links:
                    print(f"Found {len(page_comment_links)} comment links on page {current_page}")
                    all_comment_links.extend(page_comment_links)

                    # Check if there might be more pages
                    # Look for "Next" page link or other pagination indicators
                    next_link = None
                    for link in soup.find_all('a', href=True):
                        if 'pageNumber=' in link['href'] and f'pageNumber={current_page+1}' in link['href']:
                            next_link = link
                            break

                    # If we have a next page link or found a full page of results (likely more pages)
                    if next_link or len(page_comment_links) >= 25:
                        current_page += 1
                    else:
                        print(f"No more pages found after page {current_page}")
                        more_pages = False
                else:
                    print(f"No comment links found on page {current_page}, stopping pagination")
                    more_pages = False

            except Exception as e:
                print(f"⚠️ Error processing page {page_url}: {str(e)}")
                more_pages = False

        print(f"Found {len(all_comment_links)} total comment links across all pages")

        # Limit the number of comments to process if specified
        comment_links = all_comment_links
        if max_comments and max_comments > 0 and len(comment_links) > max_comments:
            print(f"Limiting to {max_comments} comments (out of {len(comment_links)} found)")
            comment_links = comment_links[:max_comments]

        # Now visit each comment link and extract the content
        all_comments = []
        for i, comment_link in enumerate(comment_links):
            try:
                # Remove any double URL (sometimes the URL is duplicated as https://www.regulations.govhttps://www.regulations.gov/...)
                if "https://www.regulations.govhttps://www.regulations.gov" in comment_link:
                    comment_link = comment_link.replace("https://www.regulations.govhttps://www.regulations.gov", "https://www.regulations.gov")

                print(f"Processing comment {i+1}/{len(comment_links)}: {comment_link}")

                # Scrape the individual comment page
                comment_page = self.app.scrape_url(
                    url=comment_link,
                    formats=["markdown", "html", "json"],
                    wait_for=5000,
                    json_options={
                        "prompt": """
                        Extract the following information from this EPA comment page:
                        - commenter_name: The name of the person or organization submitting the comment
                        - comment_date: The date the comment was submitted
                        - organization: The organization the commenter represents (if available)
                        - comment_text: The full text of the comment
                        - attachments: List of any attachment filenames and links (if available)
                        - comment_id: The EPA comment ID (format EPA-HQ-OLEM-YYYY-XXXX-NNNN)
                        """
                    }
                )

                if hasattr(comment_page, "json"):
                    comment_data = comment_page.json
                    # Add the source URL to the comment data
                    comment_data["source_url"] = comment_link
                    all_comments.append(comment_data)
                    print(f"✅ Extracted data from comment: {comment_link}")
                else:
                    print(f"⚠️ Failed to extract JSON data from comment: {comment_link}")

            except Exception as e:
                print(f"⚠️ Error processing comment {comment_link}: {str(e)}")

        return all_comments

    def save_to_json(self, data, filename):
        """Save data to a JSON file"""
        file_path = os.path.join(self.output_dir, filename)
        with open(file_path, "w") as f:
            json.dump(data, f, indent=2)
        return file_path

    def save_to_csv_excel(self, data, base_filename):
        """Save data to CSV and Excel files if it's a list of records"""
        results = []

        if not isinstance(data, list) or len(data) == 0:
            print("⚠️ Data is not in the expected format for CSV/Excel export")
            return results

        # Convert to DataFrame
        df = pd.DataFrame(data)

        # Save to CSV
        csv_path = os.path.join(self.output_dir, f"{base_filename}.csv")
        df.to_csv(csv_path, index=False)
        results.append(csv_path)

        # Save to Excel
        excel_path = os.path.join(self.output_dir, f"{base_filename}.xlsx")
        df.to_excel(excel_path, index=False)
        results.append(excel_path)

        return results

    def process_url(self, url, wait_time=5000, max_comments=5):
        """
        Process a single URL - scrape, extract structured data, and save results

        This function will:
        1. Scrape the main comments page
        2. Extract links to individual comments
        3. Visit each comment page to extract the full text and metadata
        4. Combine all comments into structured data
        5. Save results in multiple formats (JSON, CSV, Excel)

        Args:
            url: The URL to process (comments listing page)
            wait_time: Time to wait for dynamic content (ms)
            max_comments: Maximum number of comments to process (default: 5, None for all)

        Returns:
            Dictionary with paths to output files
        """
        url_id = url.split("/")[-2] if "/document/" in url else "unknown"
        base_filename = f"epa_{url_id}_{self.timestamp}"

        # Track output files
        output_files = {}

        # Step 1: Scrape raw data
        raw_result = self.scrape_single_url(url, wait_time)

        # Extract data from ScrapeResponse object
        raw_data = {
            "markdown": raw_result.markdown if hasattr(raw_result, "markdown") else None,
            "html": raw_result.html if hasattr(raw_result, "html") else None,
            "url": url,
            "timestamp": self.timestamp
        }

        raw_json_path = self.save_to_json(
            raw_data,
            f"{base_filename}_raw.json"
        )
        output_files["raw_json"] = raw_json_path
        print(f"✅ Raw data saved to {raw_json_path}")

        # Save markdown to a separate file if available
        if hasattr(raw_result, "markdown") and raw_result.markdown:
            markdown_path = os.path.join(self.output_dir, f"{base_filename}.md")
            with open(markdown_path, "w") as f:
                f.write(raw_result.markdown)
            output_files["markdown"] = markdown_path
            print(f"✅ Markdown content saved to {markdown_path}")

        # Step 2: Extract structured data
        try:
            structured_data = self.extract_structured_data(url, max_comments=max_comments)

            # Save structured data to JSON
            structured_json_path = self.save_to_json(
                structured_data,
                f"{base_filename}_structured.json"
            )
            output_files["structured_json"] = structured_json_path
            print(f"✅ Structured data saved to {structured_json_path}")

            # Save to CSV and Excel if possible
            try:
                export_paths = self.save_to_csv_excel(structured_data, base_filename)
                if export_paths:
                    output_files["csv"] = export_paths[0]
                    output_files["excel"] = export_paths[1]
                    print(f"✅ Data exported to CSV: {export_paths[0]}")
                    print(f"✅ Data exported to Excel: {export_paths[1]}")
            except Exception as e:
                print(f"⚠️ Error creating CSV/Excel: {e}")

        except Exception as e:
            print(f"⚠️ Error extracting structured data: {e}")

        return output_files

    def process_multiple_urls(self, urls, wait_time=5000, max_comments=5):
        """
        Process multiple URLs and combine results

        Args:
            urls: List of URLs to process
            wait_time: Time to wait for dynamic content (ms)
            max_comments: Maximum number of comments to process per URL (default: 5, None for all)

        Returns:
            Dictionary with paths to output files including combined results
        """
        all_comments = []
        all_output_files = {"individual": {}, "combined": {}}

        # Process each URL
        for url in tqdm(urls, desc="Processing URLs"):
            url_output_files = self.process_url(url, wait_time, max_comments)
            url_id = url.split("/")[-2] if "/document/" in url else "unknown"
            all_output_files["individual"][url_id] = url_output_files

            # Load structured data if available
            if "structured_json" in url_output_files:
                try:
                    with open(url_output_files["structured_json"], "r") as f:
                        structured_data = json.load(f)

                    # Add source URL to each comment
                    if isinstance(structured_data, list):
                        for comment in structured_data:
                            comment["source_url"] = url
                        all_comments.extend(structured_data)
                except Exception as e:
                    print(f"⚠️ Error loading structured data from {url}: {e}")

        # Save combined results if we have multiple URLs
        if len(urls) > 1 and all_comments:
            combined_filename = f"epa_combined_{self.timestamp}"

            # Save combined JSON
            combined_json_path = self.save_to_json(
                all_comments,
                f"{combined_filename}.json"
            )
            all_output_files["combined"]["json"] = combined_json_path
            print(f"✅ Combined data saved to {combined_json_path}")

            # Save combined CSV and Excel
            try:
                export_paths = self.save_to_csv_excel(all_comments, combined_filename)
                if export_paths:
                    all_output_files["combined"]["csv"] = export_paths[0]
                    all_output_files["combined"]["excel"] = export_paths[1]
                    print(f"✅ Combined data exported to CSV: {export_paths[0]}")
                    print(f"✅ Combined data exported to Excel: {export_paths[1]}")
            except Exception as e:
                print(f"⚠️ Error creating combined CSV/Excel: {e}")

        return all_output_files

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Scrape EPA comments from regulations.gov")
    parser.add_argument(
        "--urls",
        nargs="+",
        default=["https://www.regulations.gov/document/EPA-HQ-OLEM-2017-0463-0001/comment"],
        help="URLs to scrape (default: EPA-HQ-OLEM-2017-0463-0001 comments)"
    )
    parser.add_argument(
        "--output-dir",
        default="output",
        help="Directory to store output files"
    )
    parser.add_argument(
        "--wait-time",
        type=int,
        default=5000,
        help="Wait time in milliseconds for dynamic content"
    )
    parser.add_argument(
        "--max-comments",
        type=int,
        default=5,
        help="Maximum number of comments to process per URL (default: 5, 0 for all)"
    )
    args = parser.parse_args()

    # Initialize scraper
    scraper = EPACommentScraper(output_dir=args.output_dir)

    # Convert 0 to None for max_comments (to process all comments)
    max_comments = None if args.max_comments == 0 else args.max_comments

    # Process URLs
    if len(args.urls) == 1:
        scraper.process_url(args.urls[0], args.wait_time, max_comments)
    else:
        scraper.process_multiple_urls(args.urls, args.wait_time, max_comments)

    print("✅ Scraping completed successfully")

if __name__ == "__main__":
    main()