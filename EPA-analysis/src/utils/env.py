"""Environment variable utilities."""

import os
from dotenv import load_dotenv

def load_env_vars():
    """Load environment variables from .env file."""
    load_dotenv()

    # Required environment variables
    required_vars = [
        'OPENAI_API_KEY',
        'SUPABASE_URL',
        'SUPABASE_KEY'
    ]

    missing_vars = [var for var in required_vars if not os.getenv(var)]

    if missing_vars:
        raise EnvironmentError(
            f"Missing required environment variables: {', '.join(missing_vars)}. "
            f"Please check your .env file."
        )

    return {
        'openai_api_key': os.getenv('OPENAI_API_KEY'),
        'supabase_url': os.getenv('SUPABASE_URL'),
        'supabase_key': os.getenv('SUPABASE_KEY'),
        'model_name': os.getenv('MODEL_NAME', 'text-embedding-ada-002'),
        'chunk_size': int(os.getenv('CHUNK_SIZE', '1000')),
        'chunk_overlap': int(os.getenv('CHUNK_OVERLAP', '200')),
    }