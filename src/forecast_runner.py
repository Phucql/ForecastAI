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
    # 1. Load key from .env
    load_dotenv()
    api_key = os.getenv("TIMEGPT_API_KEY")
    if not api_key:
        raise Exception("TIMEGPT_API_KEY is missing from .env")

    # 2. Parse POST body from stdin
    data = json.loads(sys.argv[1])
    print("[DEBUG] Received payload", file=sys.stderr)

    # 3. Convert to DataFrame
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
    print(json.dumps({"error": str(e)}))

# Example for robust file reading with encoding detection (for future use):
# def read_csv_with_encoding_detection(filepath):
#     with open(filepath, 'rb') as f:
#         raw = f.read()
#         result = chardet.detect(raw)
#         encoding = result['encoding']
#     try:
#         return pd.read_csv(filepath, encoding=encoding)
#     except UnicodeDecodeError as e:
#         raise Exception(f"File encoding error: {e}. Detected encoding: {encoding}. Please upload UTF-8 CSV files.")
