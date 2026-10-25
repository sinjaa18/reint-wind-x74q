import os
import sys
from pathlib import Path

# Add backend directory to sys.path
ROOT = Path(__file__).resolve().parent.parent
for candidate in [ROOT / "backend", Path.cwd() / "backend", Path.cwd()]:
    if candidate.exists() and str(candidate) not in sys.path:
        sys.path.insert(0, str(candidate))

from app.main import app
