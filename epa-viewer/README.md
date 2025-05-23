# EPA Document Viewer

An AI-powered application to help EPA staff analyze which sections of documents receive the most comments. This tool provides a visual interface to explore relationships between document sections and public comments.

## Features

- View document structure and hierarchy
- See which sections have received the most comments
- Analyze individual comments and their matches to document sections
- AI-powered insights about comments related to specific sections
- View detailed comment information including attachments

## Technology Stack

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Database**: Supabase
- **AI**: Integration with AI services for comment analysis

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd epa-viewer
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env.local` file in the project root and add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application

## Project Structure

- `src/app` - Next.js app router pages
- `src/components` - Reusable React components
- `src/lib` - Utility functions and Supabase client

## Database Schema

The application uses the following database structure:

- **document_sections**: Stores hierarchical document content with embeddings
- **epa_comments**: Stores detailed comment information including attachments
- **comment_section_matches**: Stores relationships between comments and sections
- **top_comment_matches**: Stores high-scoring matches between comments and document sections

## Development Roadmap

- Add user authentication
- Implement advanced AI analysis of comments
- Add visualization features for comment patterns
- Develop an admin panel for document upload and management
- Add real-time collaboration features

## License

This project is intended for internal EPA use only.
