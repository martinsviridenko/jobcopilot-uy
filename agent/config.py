"""
JobCopilot Agent — Configuration & Environment Settings
"""
import os

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# Default country
DEFAULT_COUNTRY = os.environ.get("JOBCOPILOT_COUNTRY", "UY")

# Request timeout in seconds
REQUEST_TIMEOUT = int(os.environ.get("REQUEST_TIMEOUT", "15"))

# User-Agent rotation for scrapers
USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
]

# Source Priority Ranking (Lower number = Higher authority)
SOURCE_PRIORITY = {
    "ats_official": 1,       # Teamtailor, Greenhouse, Lever, Workday directly on company careers
    "company_direct": 1,     # Direct company careers site
    "hr_consultancy": 2,     # Advice, Prota, Manpower, Randstad, Michael Page
    "smarttalent": 3,        # Smart Talent Uruguay XXI
    "linkedin_direct": 3,    # Direct company post on LinkedIn
    "linkedin_guest": 4,     # LinkedIn guest search
    "buscojobs": 5,          # BuscoJobs aggregator
    "gallito": 5,            # Gallito Luis
    "general_web": 6         # Fallback
}
