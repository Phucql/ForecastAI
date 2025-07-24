#!/usr/bin/env python3
import sys
import json
import os
from dotenv import load_dotenv

print("Python version:", sys.version)
print("Python executable:", sys.executable)

# Test imports
try:
    import pandas as pd
    print("✅ pandas imported successfully")
except ImportError as e:
    print("❌ pandas import failed:", e)

try:
    from nixtla import NixtlaClient
    print("✅ nixtla imported successfully")
except ImportError as e:
    print("❌ nixtla import failed:", e)

try:
    from utilsforecast.preprocessing import fill_gaps
    print("✅ utilsforecast imported successfully")
except ImportError as e:
    print("❌ utilsforecast import failed:", e)

# Test environment variables
load_dotenv()
api_key = os.getenv("TIMEGPT_API_KEY")
if api_key:
    print("✅ TIMEGPT_API_KEY found")
else:
    print("❌ TIMEGPT_API_KEY not found")

# Test basic functionality
try:
    df = pd.DataFrame({
        'time': ['2023-01-01', '2023-02-01', '2023-03-01'],
        'target': [100, 150, 200],
        'PRD_LVL_MEMBER_NAME': ['Item1', 'Item1', 'Item1']
    })
    print("✅ DataFrame creation successful")
    print("DataFrame shape:", df.shape)
except Exception as e:
    print("❌ DataFrame creation failed:", e)

print("Test completed") 