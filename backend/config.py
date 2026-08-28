# config.py
# Shared setup used by every step: load keys, build the API clients, pick the model.

import os
from datetime import date
from anthropic import Anthropic
from tavily import TavilyClient
from dotenv import load_dotenv

load_dotenv()

# Change the model in ONE place and every file picks it up.
MODEL = "claude-sonnet-4-5"   # check console.anthropic.com for the current model id

# Today's date, worked out automatically so searches stay current instead of guessing a year.
TODAY = date.today().strftime("%B %Y")   # e.g. "August 2026"

anthropic_client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
tavily_client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])