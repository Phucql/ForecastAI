import json
import sys
import os
import pandas as pd
from dotenv import load_dotenv
import logging
import signal

# Optional: clean logs
logging.getLogger("nixtla.nixtla_client").setLevel(logging.CRITICAL)

print("[DEBUG] Python script started", file=sys.stderr)
print(f"[DEBUG] Current working directory: {os.getcwd()}", file=sys.stderr)
print(f"[DEBUG] Python executable: {sys.executable}", file=sys.stderr)
print(f"[DEBUG] Python version: {sys.version}", file=sys.stderr)

try:
    # 1. Load key from environment variables
    print("[DEBUG] Loading environment variables...", file=sys.stderr)
    load_dotenv()
    
    # Try multiple possible environment variable names for the API key
    api_key = os.getenv("TIMEGPT_API_KEY") or os.getenv("VITE_TIMEGPT_API_KEY") or os.environ.get("TIMEGPT_API_KEY") or os.environ.get("VITE_TIMEGPT_API_KEY")
    print(f"[DEBUG] API key loaded from environment: {'Yes' if api_key else 'No'}", file=sys.stderr)

    # 2. Import TimeGPT libraries
    print("[DEBUG] Importing TimeGPT libraries...", file=sys.stderr)
    try:
        from nixtla import NixtlaClient
        print("[DEBUG] NixtlaClient imported successfully", file=sys.stderr)
    except ImportError as e:
        print(f"[DEBUG] Failed to import NixtlaClient: {e}", file=sys.stderr)
        raise Exception(f"Failed to import NixtlaClient: {e}")
    
    try:
        from utilsforecast.preprocessing import fill_gaps
        print("[DEBUG] utilsforecast imported successfully", file=sys.stderr)
    except ImportError as e:
        print(f"[DEBUG] Failed to import utilsforecast: {e}", file=sys.stderr)
        # This is optional, so we'll continue without it
        print("[DEBUG] Continuing without utilsforecast...", file=sys.stderr)

    # 3. Parse POST body from stdin
    print("[DEBUG] Reading payload from stdin...", file=sys.stderr)
    payload = sys.stdin.read()
    print(f"[DEBUG] Received payload from stdin, length: {len(payload)}", file=sys.stderr)
    
    if not payload:
        raise Exception("No payload received from stdin")
    
    try:
        data = json.loads(payload)
        print("[DEBUG] Payload received and parsed successfully", file=sys.stderr)
    except json.JSONDecodeError as e:
        print(f"[DEBUG] Failed to parse JSON payload: {e}", file=sys.stderr)
        print(f"[DEBUG] Payload content (first 500 chars): {payload[:500]}", file=sys.stderr)
        raise Exception(f"Failed to parse JSON payload: {e}")
    
    print(f"[DEBUG] Horizon value: {data.get('horizon', 'Not found')}", file=sys.stderr)
    print(f"[DEBUG] Series count: {len(data.get('series', []))}", file=sys.stderr)
    
    # Use API key from payload if provided, otherwise use environment variable
    if data.get('api_key'):
        api_key = data['api_key']
        print("[DEBUG] Using API key from payload", file=sys.stderr)
    elif not api_key:
        print("[DEBUG] Available environment variables:", file=sys.stderr)
        for key, value in os.environ.items():
            if 'TIMEGPT' in key or 'API' in key:
                print(f"[DEBUG] {key}: {'***HIDDEN***' if 'KEY' in key else value}", file=sys.stderr)
        raise Exception("TIMEGPT_API_KEY is missing from both payload and environment variables")

    # 4. Convert to DataFrame
    print("[DEBUG] Converting to DataFrame...", file=sys.stderr)
    df = pd.DataFrame(data["series"])
    print("[DEBUG] DataFrame after creation:", df.head(), file=sys.stderr)
    
    # Use PRD_LVL_MEMBER_NAME as the unique_id for each series
    # Ensure columns: PRD_LVL_MEMBER_NAME, time, target
    # Rename columns for forecasting
    if "PRD_LVL_MEMBER_NAME" not in df.columns:
        raise Exception("Input data must contain 'PRD_LVL_MEMBER_NAME' for each record.")
    
    df = df.rename(columns={
        "time": "ds",
        "target": "y",
        "PRD_LVL_MEMBER_NAME": "unique_id"
    })
    print("[DEBUG] DataFrame after renaming:", df.head(), file=sys.stderr)
    
    # Convert time column to datetime
    try:
        df["ds"] = pd.to_datetime(df["ds"])
        print("[DEBUG] Time column converted to datetime successfully", file=sys.stderr)
    except Exception as e:
        print(f"[DEBUG] Failed to convert time column: {e}", file=sys.stderr)
        raise Exception(f"Failed to convert time column to datetime: {e}")

    # Aggregate to ensure unique (unique_id, ds)
    df = df.groupby(["unique_id", "ds"], as_index=False).agg({"y": "sum"})
    print("[DEBUG] DataFrame after aggregation:", df.head(), file=sys.stderr)

    # 4. Fill all monthly gaps for the series
    min_date = df["ds"].min()
    max_date = df["ds"].max()
    all_months = pd.date_range(start=min_date, end=max_date, freq="MS")

    # Use the unique_id from the earliest date
    unique_id = df.loc[df["ds"] == min_date, "unique_id"].iloc[0]
    # Aggregate by month in case of duplicates
    df = df.groupby(["ds"], as_index=False).agg({"y": "sum"})
    df["unique_id"] = unique_id

    # Reindex to all months, fill missing with 0
    df = df.set_index("ds").reindex(all_months).fillna(0).reset_index()
    df = df.rename(columns={"index": "ds"})
    df["unique_id"] = unique_id  # Ensure all rows have the same unique_id

    print("[DEBUG] DataFrame after filling all months (full):\n" + df.to_string(), file=sys.stderr)

    # Check if there is any data left to forecast
    if df.empty:
        print(json.dumps({"error": "No data left to forecast after filling missing months."}))
        sys.exit(0)

    # 5. Forecast
    print("[DEBUG] Creating NixtlaClient...", file=sys.stderr)
    try:
        client = NixtlaClient(api_key=api_key)
        print("[DEBUG] NixtlaClient created successfully", file=sys.stderr)
    except Exception as e:
        print(f"[DEBUG] Failed to create NixtlaClient: {e}", file=sys.stderr)
        raise Exception(f"Failed to create TimeGPT client: {e}")
    
    # Robust debug output before forecasting
    print("[DEBUG] DataFrame sent to forecast (full):\n" + df.to_string(), file=sys.stderr)
    print("[DEBUG] DataFrame head:\n", df.head(), file=sys.stderr)
    print("[DEBUG] DataFrame shape:", df.shape, file=sys.stderr)
    print("[DEBUG] DataFrame columns:", df.columns, file=sys.stderr)
    print("[DEBUG] DataFrame dtypes:", df.dtypes, file=sys.stderr)
    print("[DEBUG] unique_id values:", df['unique_id'].unique(), file=sys.stderr)
    print("[DEBUG] y values:", df['y'].values, file=sys.stderr)
    print("[DEBUG] ds values:", df['ds'].values, file=sys.stderr)
    
    if df.empty:
        print("[DEBUG] DataFrame is empty before forecast!", file=sys.stderr)
        print(json.dumps({"error": "No data left to forecast after filling missing months."}))
        sys.exit(0)
    if not all(col in df.columns for col in ['unique_id', 'ds', 'y']):
        print("[DEBUG] DataFrame missing required columns!", file=sys.stderr)
        print(json.dumps({"error": "DataFrame missing required columns before forecast."}))
        sys.exit(0)
    
    print(f"[DEBUG] About to call TimeGPT with horizon={data['horizon']}", file=sys.stderr)
    print("[DEBUG] TimeGPT API call starting...", file=sys.stderr)
    
    try:
        forecast_df = client.forecast(
            df=df,
            h=data["horizon"],
            freq="MS",
            time_col="ds",
            target_col="y",
            id_col="unique_id"
        )
        print("[DEBUG] TimeGPT API call completed successfully!", file=sys.stderr)
        print("[DEBUG] Forecast DataFrame:", forecast_df.head(), file=sys.stderr)
    except Exception as e:
        print(f"[DEBUG] TimeGPT API call failed: {e}", file=sys.stderr)
        raise Exception(f"TimeGPT API call failed: {e}")

    # Rename columns to match backend merge logic
    forecast_df = forecast_df.rename(columns={
        "y": "TimeGPT",
        "unique_id": "PRD_LVL_MEMBER_NAME",
        "ds": "TIM_LVL_MEMBER_VALUE"  
    })

    # ✅ Convert TIM_LVL_MEMBER_VALUE to string-formatted time values
    forecast_df["TIM_LVL_MEMBER_VALUE"] = pd.to_datetime(forecast_df["TIM_LVL_MEMBER_VALUE"]).dt.strftime('%Y-%m-%d')

    # 6. Output
    print("✅ Forecast complete", file=sys.stderr)
    result_json = forecast_df.to_json(orient="records")
    print(f"[DEBUG] Result JSON length: {len(result_json)}", file=sys.stderr)
    print(result_json)

    
except Exception as e:
    print(f"[DEBUG] Exception occurred: {e}", file=sys.stderr)
    import traceback
    print(f"[DEBUG] Traceback: {traceback.format_exc()}", file=sys.stderr)
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
