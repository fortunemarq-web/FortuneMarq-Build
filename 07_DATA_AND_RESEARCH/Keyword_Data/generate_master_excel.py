import os
import pandas as pd
import glob

# Find all CSV files, ignoring the virtual environment folder
files = [f for f in glob.glob("**/*.csv", recursive=True) if "venv" not in f]

summary_data = []
all_keywords_list = []

print("Processing files for Master Excel...")

for file in files:
    try:
        # Load file with encoding handling
        try:
            df = pd.read_csv(file)
            if df.shape[1] < 2: df = pd.read_csv(file, sep='\t')
        except UnicodeDecodeError:
            df = pd.read_csv(file, encoding='utf-16', sep='\t')

        # Clean column names
        df.columns = [c.strip() for c in df.columns]
        
        kw_col = 'Keyword'
        search_col = 'Avg. monthly searches'
        low_bid = 'Top of page bid (low range)'
        high_bid = 'Top of page bid (high range)'

        if search_col in df.columns and kw_col in df.columns:
            # Clean numeric data
            df[search_col] = pd.to_numeric(df[search_col], errors='coerce').fillna(0)
            df[low_bid] = pd.to_numeric(df[low_bid], errors='coerce').fillna(0)
            df[high_bid] = pd.to_numeric(df[high_bid], errors='coerce').fillna(0)
            
            # Identify City and Category from file path
            path_parts = file.split('/')
            city = path_parts[0].replace('_Keywords', '').replace('_Cleaned', '')
            category = os.path.basename(file).replace(city, '').replace('.csv', '').strip('_ ')

            # Calculate Stats
            total_searches = df[search_col].sum()
            avg_cpc = df[[low_bid, high_bid]].mean(axis=1).mean()

            # Add to Summary
            summary_data.append({
                'City': city,
                'Category': category,
                'Total Monthly Searches': total_searches,
                'Avg. CPC ($)': round(avg_cpc, 2),
                'File Name': os.path.basename(file)
            })

            # Add source info to individual keywords and collect
            df['City'] = city
            df['Category'] = category
            all_keywords_list.append(df[[kw_col, search_col, low_bid, high_bid, 'City', 'Category']])

    except Exception as e:
        print(f"Skipping {file}: {e}")

# Create DataFrames
summary_df = pd.DataFrame(summary_data)
master_keywords_df = pd.concat(all_keywords_list, ignore_index=True)

# Write to Excel
with pd.ExcelWriter('FortuneMarq_Master_Keyword_Research.xlsx', engine='openpyxl') as writer:
    summary_df.sort_values(['City', 'Total Monthly Searches'], ascending=[True, False]).to_excel(writer, sheet_name='Summary Report', index=False)
    master_keywords_df.sort_values(search_col, ascending=False).to_excel(writer, sheet_name='All Keywords Master', index=False)

print("\nSuccess! Master file created: FortuneMarq_Master_Keyword_Research.xlsx")
