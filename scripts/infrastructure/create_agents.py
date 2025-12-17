#!/usr/bin/env python3
"""
Script to create AI agent files for the ai-service.
Run this script from the project root directory.
"""

import os
from pathlib import Path

# Define base directory
BASE_DIR = Path(__file__).parent / "services" / "ai-service" / "src" / "agents"

# Ensure directory exists
BASE_DIR.mkdir(parents=True, exist_ok=True)

# File contents as a dictionary
files = {}

# __init__.py
files["__init__.py"] = '''"""
AI Agent modules for advanced job search assistance.
"""

from .competitive_analysis import CompetitiveAnalysisAgent
from .fraud_detection import FraudDetectionAgent
from .emotional_intelligence import EmotionalIntelligenceAgent
from .multi_language import MultiLanguageAgent

__all__ = [
    "CompetitiveAnalysisAgent",
    "FraudDetectionAgent",
    "EmotionalIntelligenceAgent",
    "MultiLanguageAgent",
]
'''

print("Creating agent files...")

for filename, content in files.items():
    filepath = BASE_DIR / filename
    print(f"Creating {filepath}...")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ Created {filename}")

print("\nAll files created successfully!")
print(f"Files created in: {BASE_DIR}")
