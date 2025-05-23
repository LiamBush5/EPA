# EPA Comment Analysis System

This repository contains tools for analyzing EPA comments and matching them to relevant sections of legal documents using vector embeddings stored in Supabase.

## Project Structure

```
EPA-analysis/
├── src/                       # Source code
│   ├── processing/            # Data processing scripts
│   ├── analysis/              # Analysis scripts
│   ├── db/                    # Database interface scripts
│   └── utils/                 # Utility functions
├── scripts/                   # Shell scripts for automating workflows
├── data/                      # Data directories
│   ├── attachments/           # PDF attachments from EPA comments
│   ├── documents/             # Legal documents
│   └── processed/             # Processed data files
├── output/                    # Analysis outputs
├── config/                    # Configuration files
│   └── examples/              # Example configuration files
└── docs/                      # Documentation
```

## Setup

1. Navigate to the project directory:
   ```
   cd EPA-analysis
   ```

2. Run the setup script:
   ```
   ./scripts/setup.sh
   ```

3. Edit `.env` to add your API keys:
   - Add your OpenAI API key for embeddings
   - Add your Supabase URL and service key

## Usage

See the [Documentation](docs/README.md) for detailed usage instructions.

## License

[MIT](LICENSE)
