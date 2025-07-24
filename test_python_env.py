#!/usr/bin/env python3

import sys
import os
from dotenv import load_dotenv

print("=== Python Environment Test ===")
print(f"Python version: {sys.version}")
print(f"Python executable: {sys.executable}")
print(f"Current working directory: {os.getcwd()}")

# Load environment variables
load_dotenv()
api_key = os.getenv("TIMEGPT_API_KEY")
print(f"TIMEGPT_API_KEY loaded: {'Yes' if api_key else 'No'}")

# Try to import required libraries
try:
    import pandas as pd
    print(f"Pandas version: {pd.__version__}")
except ImportError as e:
    print(f"Pandas import failed: {e}")

try:
    from nixtla import NixtlaClient
    print("NixtlaClient imported successfully")
except ImportError as e:
    print(f"NixtlaClient import failed: {e}")

try:
    from utilsforecast.preprocessing import fill_gaps
    print("utilsforecast imported successfully")
except ImportError as e:
    print(f"utilsforecast import failed: {e}")

# Test TimeGPT connection if API key is available
if api_key:
    try:
        print("Testing TimeGPT connection...")
        client = NixtlaClient(api_key=api_key)
        print("TimeGPT client created successfully")
        
        # Test with minimal data
        import pandas as pd
        test_df = pd.DataFrame({
            'ds': pd.date_range('2023-01-01', periods=12, freq='MS'),
            'y': [100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210],
            'unique_id': ['test'] * 12
        })
        
        print("Test DataFrame created:")
        print(test_df.head())
        
        forecast = client.forecast(
            df=test_df,
            h=3,
            freq="MS",
            time_col="ds",
            target_col="y",
            id_col="unique_id"
        )
        print("TimeGPT forecast test successful!")
        print("Forecast result:")
        print(forecast.head())
        
    except Exception as e:
        print(f"TimeGPT test failed: {e}")
else:
    print("No API key available for TimeGPT test")

print("=== Test Complete ===") 