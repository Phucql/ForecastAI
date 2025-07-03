import json
import sys
import os
import pandas as pd
from dotenv import load_dotenv
from nixtla import NixtlaClient
from utilsforecast.preprocessing import fill_gaps
import logging
import signal
import chardet  # For encoding detection

# Optional: clean logs
logging.getLogger("nixtla.nixtla_client").setLevel(logging.CRITICAL)

try:
    # 1. Load key from environment variables (preferred for deployment)
    api_key = os.environ.get("TIMEGPT_API_KEY")
    
    # If not found in environment, try .env file
    if not api_key:
        try:
            load_dotenv()
            api_key = os.getenv("TIMEGPT_API_KEY")
        except UnicodeDecodeError:
            # Try with different encodings if UTF-8 fails
            try:
                load_dotenv(encoding='latin1')
                api_key = os.getenv("TIMEGPT_API_KEY")
            except:
                try:
                    load_dotenv(encoding='cp1252')
                    api_key = os.getenv("TIMEGPT_API_KEY")
                except:
                    pass  # Continue without .env file
    
    if not api_key:
        raise Exception("TIMEGPT_API_KEY is missing from environment variables")

    # 2. Parse POST body from stdin
    import sys
    payload = sys.stdin.read()
    print(f"[DEBUG] Received payload from stdin, length: {len(payload)}", file=sys.stderr)
    
    if not payload:
        raise Exception("No payload received from stdin")
    
    data = json.loads(payload)
    print("[DEBUG] Successfully parsed JSON payload", file=sys.stderr)
    print(f"[DEBUG] Payload keys: {list(data.keys())}", file=sys.stderr)
    print(f"[DEBUG] Series length: {len(data.get('series', []))}", file=sys.stderr)

    # 3. Convert to DataFrame
    print("[DEBUG] About to create DataFrame from series data", file=sys.stderr)
    series_data = data["series"]
    print(f"[DEBUG] Series data type: {type(series_data)}", file=sys.stderr)
    print(f"[DEBUG] First few series items: {series_data[:2] if series_data else 'Empty'}", file=sys.stderr)
    
    df = pd.DataFrame(series_data)
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
    df["ds"] = pd.to_datetime(df["ds"])

    # Aggregate to ensure unique (unique_id, ds)
    df = df.groupby(["unique_id", "ds"], as_index=False).agg({"y": "sum"})
    print("[DEBUG] DataFrame after aggregation:", df.head(), file=sys.stderr)

    # 4. Fill monthly gaps
    start_date = df["ds"].min()
    end_date = df["ds"].max()
    df_filled = fill_gaps(df, freq="MS", id_col="unique_id", time_col="ds", start=start_date, end=end_date)
    df_filled["y"] = df_filled["y"].interpolate(limit_direction="both") 
    print("[DEBUG] DataFrame after filling gaps:", df_filled.head(), file=sys.stderr)

    # 5. Forecast
    client = NixtlaClient(api_key=api_key)
    print("[DEBUG] DataFrame before forecasting:", df_filled.head(), file=sys.stderr)
    forecast_df = client.forecast(
        df=df_filled,
        h=data["horizon"],
        freq="MS",
        time_col="ds",
        target_col="y",
        id_col="unique_id"
    )
    print("[DEBUG] Forecast DataFrame:", forecast_df.head(), file=sys.stderr)

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
    print(forecast_df.to_json(orient="records"))

    
except Exception as e:
    import traceback
    error_details = {
        "error": str(e),
        "type": type(e).__name__,
        "traceback": traceback.format_exc()
    }
    print(json.dumps(error_details))
