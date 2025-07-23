import json
import sys
import os
import pandas as pd
from dotenv import load_dotenv
from nixtla import NixtlaClient
from utilsforecast.preprocessing import fill_gaps
import logging
import signal

# Optional: clean logs
logging.getLogger("nixtla.nixtla_client").setLevel(logging.CRITICAL)

print("[DEBUG] Python script started", file=sys.stderr)

try:
    # 1. Load key from .env
    load_dotenv()
    api_key = os.getenv("KLUG_AI_FORECAST_API_KEY")
    if not api_key:
        raise Exception("KLUG_AI_FORECAST_API_KEY is missing from .env")

    # 2. Parse POST body from stdin
    payload = sys.stdin.read()
    print(f"[DEBUG] Received payload from stdin, length: {len(payload)}", file=sys.stderr)
    
    if not payload:
        raise Exception("No payload received from stdin")
    
    data = json.loads(payload)
    print("[DEBUG] Payload received and parsed", file=sys.stderr)
    print("[DEBUG] Successfully parsed JSON payload", file=sys.stderr)

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
    client = NixtlaClient(api_key=api_key)
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
    forecast_df = client.forecast(
        df=df,
        h=data["horizon"],
        freq="MS",
        time_col="ds",
        target_col="y",
        id_col="unique_id"
    )
    print("[DEBUG] Forecast DataFrame:", forecast_df.head(), file=sys.stderr)

    # Rename columns to match backend merge logic
    forecast_df = forecast_df.rename(columns={
        "y": "Klug AI Forecast",
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
