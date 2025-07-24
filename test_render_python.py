#!/usr/bin/env python3

import sys
import os
import json

print("=== Render Python Environment Test ===")
print(f"Python version: {sys.version}")
print(f"Python executable: {sys.executable}")
print(f"Current working directory: {os.getcwd()}")

# Check environment variables
print("\n=== Environment Variables ===")
timegpt_key = os.getenv("TIMEGPT_API_KEY") or os.getenv("VITE_TIMEGPT_API_KEY")
print(f"TIMEGPT_API_KEY available: {'Yes' if timegpt_key else 'No'}")

# List all environment variables (without sensitive values)
print("\n=== All Environment Variables ===")
for key, value in os.environ.items():
    if 'KEY' in key or 'PASSWORD' in key or 'SECRET' in key:
        print(f"{key}: ***HIDDEN***")
    else:
        print(f"{key}: {value}")

# Test imports
print("\n=== Testing Imports ===")
try:
    import pandas as pd
    print(f"✅ Pandas version: {pd.__version__}")
except ImportError as e:
    print(f"❌ Pandas import failed: {e}")

try:
    from dotenv import load_dotenv
    print("✅ python-dotenv imported successfully")
except ImportError as e:
    print(f"❌ python-dotenv import failed: {e}")

try:
    from nixtla import NixtlaClient
    print("✅ NixtlaClient imported successfully")
except ImportError as e:
    print(f"❌ NixtlaClient import failed: {e}")

try:
    from utilsforecast.preprocessing import fill_gaps
    print("✅ utilsforecast imported successfully")
except ImportError as e:
    print(f"❌ utilsforecast import failed: {e}")

# Test file paths
print("\n=== File Path Tests ===")
script_dir = os.path.dirname(os.path.abspath(__file__))
print(f"Script directory: {script_dir}")
forecast_runner_path = os.path.join(script_dir, "src", "forecast_runner.py")
print(f"Forecast runner path: {forecast_runner_path}")
print(f"Forecast runner exists: {os.path.exists(forecast_runner_path)}")

# Test TimeGPT connection if possible
if timegpt_key:
    print("\n=== TimeGPT Connection Test ===")
    try:
        from nixtla import NixtlaClient
        client = NixtlaClient(api_key=timegpt_key)
        print("✅ TimeGPT client created successfully")
        
        # Test with minimal data
        import pandas as pd
        test_df = pd.DataFrame({
            'ds': pd.date_range('2023-01-01', periods=12, freq='MS'),
            'y': [100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210],
            'unique_id': ['test'] * 12
        })
        
        print("✅ Test DataFrame created")
        
        forecast = client.forecast(
            df=test_df,
            h=3,
            freq="MS",
            time_col="ds",
            target_col="y",
            id_col="unique_id"
        )
        print("✅ TimeGPT forecast test successful!")
        
    except Exception as e:
        print(f"❌ TimeGPT test failed: {e}")
else:
    print("\n❌ No API key available for TimeGPT test")

print("\n=== Test Complete ===") 