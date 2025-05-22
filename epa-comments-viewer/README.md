# EPA Comments Viewer

A Next.js web application to view and analyze public comments on the EPA's proposed rule "Increasing Recycling: Adding Aerosol Cans to Universal Waste Regulations."

## Overview

This application provides an organized and searchable interface for exploring public comments submitted to the EPA regarding the proposed aerosol cans regulation. It enables users to:

- Browse comments by regulatory section
- View commenter information and full comment text
- Search for specific topics, commenters, or organizations
- Understand which sections received the most public feedback

## Features

- **Dashboard:** Overview of key statistics and most commented sections
- **Section Browser:** Navigate through all regulatory sections with comment counts
- **Comment Viewer:** Read full comments with commenter details and metadata
- **Search Functionality:** Find specific comments by keyword or metadata
- **Responsive Design:** Works on desktop, tablet, and mobile devices

## Installation

### Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher

### Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd epa-comments-viewer
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Project Structure

```
epa-comments-viewer/
│
├── public/              # Static files and assets
│   └── data/            # JSON data files
│
├── src/
│   ├── app/             # Next.js app router pages
│   │   ├── comments/    # Individual comment pages
│   │   ├── sections/    # Section listings and details
│   │   ├── search/      # Search functionality
│   │   └── about/       # About the project
│   │
│   ├── components/      # Reusable UI components
│   ├── lib/             # Utility functions and data processing
│   └── data/            # Data models and structures
│
└── README.md            # Project documentation
```

## Data Sources

This application uses data from:

1. **Public Comments:** Scraped from regulations.gov for the EPA docket EPA-HQ-OLEM-2017-0463
2. **Section Analysis:** Generated using AI to identify which comments address specific regulation sections

## Development

### Building for Production

```
npm run build
```

### Running in Production Mode

```
npm run start
```

## License

This project is intended for educational and analytical purposes.