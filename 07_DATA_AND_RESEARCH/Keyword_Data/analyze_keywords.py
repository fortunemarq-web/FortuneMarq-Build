import os
import pandas as pd
import glob

# Search for all CSV files, ignoring the virtual environment folder
files = [f for f in glob.glob("**/*.csv", recursive=True) if "venv" not in f]

print("FORTUNEMARQ KEYWORD RESEARCH MASTER REPORT")
print("=" * 80)

for file in files:
    try:
        # Attempt to read the file. Google Ads exports are usually UTF-8 or UTF-16.
        try:
            df = pd.read_csv(file)
            if df.shape[1] < 2: # If it didn't parse correctly, try tab separator
                df = pd.read_csv(file, sep='\t')
        except UnicodeDecodeError:
            df = pd.read_csv(file, encoding='utf-16', sep='\t')

        # Clean column names (remove leading/trailing spaces and handle case)
        df.columns = [c.strip() for c in df.columns]
        
        # Define the exact column names from your sample
        kw_col = 'Keyword'
        search_col = 'Avg. monthly searches'
        low_bid = 'Top of page bid (low range)'
        high_bid = 'Top of page bid (high range)'

        # Check if required columns exist
        if search_col in df.columns and kw_col in df.columns:
            # Clean numeric data (handle strings, commas, or NaN)
            df[search_col] = pd.to_numeric(df[search_col], errors='coerce').fillna(0)
            
            # Calculate Metrics
            total_searches = df[search_col].sum()
            
            # Calculate Avg CPC (average of low and high range bids)
            df['mean_cpc'] = df[[low_bid, high_bid]].mean(axis=1)
            avg_cpc = df['mean_cpc'].mean()

            # Get Top 20 Keywords
            top_20 = df.sort_values(by=search_col, ascending=False).head(20)

            # Print Report for this file
            print(f"FILE: {file}")
            print(f"{'-'*len(file)}")
            print(f"Total Monthly Searches: {int(total_searches):,}")
            print(f"Average CPC Estimate:  ${avg_cpc:.2f}")
            print("\nTOP 20 KEYWORDS:")
            print(f"{'Keyword':<40} | {'Monthly Searches':<15}")
            print("-" * 60)
            for _, row in top_20.iterrows():
                print(f"{str(row[kw_col])[:38]:<40} | {int(row[search_col]):<15,}")
            print("\n" + "="*80 + "\n")
            
        else:
            print(f"Skipping {file}: Missing 'Avg. monthly searches' column.")

    except Exception as e:
        print(f"Error processing {file}: {e}")
