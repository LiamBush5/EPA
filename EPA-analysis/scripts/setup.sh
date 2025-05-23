#!/bin/bash

# This script sets up the EPA Comment Analysis System

echo "Setting up EPA Comment Analysis System..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed."
    exit 1
fi

# Check if pip is installed
if ! command -v pip &> /dev/null; then
    echo "Error: pip is required but not installed."
    exit 1
fi

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv env

# Activate virtual environment
echo "Activating virtual environment..."
source env/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Set up environment file
if [ ! -f .env ]; then
    echo "Setting up environment file..."
    if [ -f config/examples/epa_env.example ]; then
        cp config/examples/epa_env.example .env
        echo "Created .env file from example. Please edit it to add your API keys."
    else
        echo "Error: Environment example file not found."
        echo "Please create a .env file with the following variables:"
        echo "OPENAI_API_KEY=your_openai_api_key"
        echo "SUPABASE_URL=your_supabase_url"
        echo "SUPABASE_KEY=your_supabase_key"
    fi
fi

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p data/attachments data/documents data/processed output

echo "Setup complete! You can now run the analysis pipeline with scripts/process_all.sh"