from flask import Flask, jsonify, render_template, request
import pandas as pd
import logging
import json
import os

app = Flask(__name__, template_folder='templates')

# Configure logging
logging.basicConfig(level=logging.INFO)

@app.route('/')
def serve_index():
    return render_template('index.html')

@app.route('/data-within-bounds')
def serve_data_within_bounds():
    try:
        northEastLat = request.args.get('northEastLat', type=float)
        northEastLng = request.args.get('northEastLng', type=float)
        southWestLat = request.args.get('southWestLat', type=float)
        southWestLng = request.args.get('southWestLng', type=float)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 100, type=int)
        filters = request.args.get('filters', '{}')

        logging.info(f"Received bounds: NE({northEastLat}, {northEastLng}), SW({southWestLat}, {southWestLng}), Page: {page}, Per Page: {per_page}, Filters: {filters}")

        excel_file = 'api/addresses.xlsx'
        df = pd.read_excel(excel_file)
        logging.info(f"Excel file read successfully. Data: {df.head()}")

        # Replace NaN values with empty strings
        df = df.fillna("")

        # Apply filters if any
        filters = json.loads(filters)
        for column, filter in filters.items():
            if 'values' in filter:
                df = df[df[column].astype(str).isin(filter['values'])]
            if 'search' in filter and filter['search']:
                df = df[df[column].astype(str).str.contains(filter['search'], case=False, na=False)]

        # Filter data within bounds
        filtered_df = df[(df['Latitude'] >= southWestLat) & (df['Latitude'] <= northEastLat) & (df['Longitude'] >= southWestLng) & (df['Longitude'] <= northEastLng)]
        
        # Paginate the filtered data
        start = (page - 1) * per_page
        end = start + per_page
        data = filtered_df.iloc[start:end].to_dict(orient='records')

        logging.info(f"Filtered data to be sent: {data[:5]}... (and more)")

        return jsonify(data)
    except Exception as e:
        logging.error(f"Error processing request: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/columns')
def serve_columns():
    try:
        excel_file = 'api/addresses.xlsx'
        df = pd.read_excel(excel_file)
        columns = df.columns.tolist()
        return jsonify(columns)
    except Exception as e:
        logging.error(f"Error processing request: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
