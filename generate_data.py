import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

# ==========================================
# 1. CONFIGURATION & FILES
# ==========================================

HISTORIC_DATA_FILE = "data/historic_data.csv"
GARAGE_DATA_FILE = "data/parking_garage.csv"
OUTPUT_FILE = "data/synthetic_parking_occupancy.csv"

# Configuration for generation
DAYS_TO_GENERATE = 7
START_DATE = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

# Color to Percentage Mapping (Uniform Distribution)
# Green: 0% - 75%
# Yellow: 75% - 90%
# Red: 90% - 100%
COLOR_MAP = {"grün": (0.00, 0.75), "gelb": (0.75, 0.90), "rot": (0.90, 1.00)}

# ==========================================
# 2. DATA LOADING
# ==========================================

# A. Load Historic Pattern Data
print(f"Loading patterns from {HISTORIC_DATA_FILE}...")
# We expect the file to look like: _id,p+r_anlage,wt_06-07_uhr,...
df_patterns = pd.read_csv(HISTORIC_DATA_FILE)

# B. Load Garage Metadata (for Address and Capacity)
print(f"Loading garage details from {GARAGE_DATA_FILE}...")
df_garages = pd.read_csv(GARAGE_DATA_FILE)

# ==========================================
# 3. HELPER FUNCTIONS
# ==========================================


def get_day_type(date_obj):
    """
    Determines if the date is a Weekday (wt), Saturday (sa), or Sunday (so).
    """
    weekday = date_obj.weekday()  # 0=Monday, 6=Sunday
    if weekday == 5:
        return "sa"
    elif weekday == 6:
        return "so"
    else:
        return "wt"


def get_column_name(hour, day_type):
    """
    Maps a specific hour (0-23) to the correct column name in historic_data.csv.
    """
    # Logic based on the provided header structure
    if 6 <= hour < 7:
        suffix = "06-07_uhr"
    elif 7 <= hour < 8:
        suffix = "07-08_uhr"
    elif 8 <= hour < 9:
        suffix = "08-09_uhr"
    elif 9 <= hour < 10:
        suffix = "09-10_uhr"
    elif 10 <= hour < 12:
        suffix = "10-12_uhr"
    elif 12 <= hour < 14:
        suffix = "12-14_uhr"
    elif 14 <= hour < 16:
        suffix = "14-16_uhr"
    elif 16 <= hour < 18:
        suffix = "16-18_uhr"
    elif 18 <= hour < 20:
        suffix = "18-20_uhr"
    else:
        # Covers 20:00 to 06:00 (Night shift)
        suffix = "20-06_uhr"

    return f"{day_type}_{suffix}"


# ==========================================
# 4. GENERATION LOOP
# ==========================================

print("Generating synthetic data...")
synthetic_data = []

# Loop through each facility in the historic patterns
for _, row_pattern in df_patterns.iterrows():
    # Get Facility Name
    facility_name = row_pattern["p+r_anlage"]

    # Find matching facility in the garage file to get Capacity & Address
    # We look for a match in 'name_anlage'
    match = df_garages[df_garages["name_anlage"] == facility_name]

    if not match.empty:
        capacity = match.iloc[0]["stellplaetze_gesamt"]
        address = match.iloc[0]["adresse"]
    else:
        # Fallback if names don't match exactly
        print(
            f"Warning: Could not find metadata for '{facility_name}'. Using defaults."
        )
        capacity = 100
        address = "Unknown"

    # Loop through the next X days
    for i in range(DAYS_TO_GENERATE):
        current_day = START_DATE + timedelta(days=i)
        day_type = get_day_type(current_day)

        # Loop through 24 hours
        for hour in range(24):
            # 1. Identify the column to read (e.g., 'wt_06-07_uhr')
            col_name = get_column_name(hour, day_type)

            # 2. Get the color rule
            try:
                color_rule = row_pattern[col_name]
            except KeyError:
                # Handle edge cases where column might be missing or typo
                color_rule = "grün"

            # 3. Determine Random Occupancy based on Color
            # Default to Green logic if color is unknown
            low, high = COLOR_MAP.get(color_rule, (0.0, 0.75))

            # Generate random float
            occupancy_rate = np.random.uniform(low, high)

            # Calculate integer spots
            occupied_spots = int(occupancy_rate * capacity)

            # 4. Build the record
            timestamp = current_day.replace(hour=hour)

            synthetic_data.append(
                {
                    "timestamp": timestamp,
                    "name": facility_name,
                    "address": address,
                    "day_type": day_type.upper(),
                    "hour": hour,
                    "rule_color": color_rule,
                    "occupancy_rate": round(occupancy_rate, 4),
                    "occupied_spots": occupied_spots,
                    "total_capacity": capacity,
                }
            )

# ==========================================
# 5. EXPORT
# ==========================================

df_synthetic = pd.DataFrame(synthetic_data)

# Save
df_synthetic.to_csv(OUTPUT_FILE, index=False)

print("-" * 30)
print(f"Done! Generated {len(df_synthetic)} rows.")
print(f"Saved to: {OUTPUT_FILE}")
print("-" * 30)
print(df_synthetic.head(10))
