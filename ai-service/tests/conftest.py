"""Make the parent directory importable so `from app import app` works
when pytest is run from anywhere."""
import os
import sys

# Add the ai-service root (parent of this tests/ folder) to the import path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
