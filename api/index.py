from flask import Flask, jsonify, render_template, request
import pandas as pd
import logging
import json

app = Flask(__name__, template_folder='../templates', static_folder='../static')

# Configure logging
logging.basicConfig(level=logging.INFO)

@app.route('/')
def serve_index():
    return render_template('index.html')

@app.route('/columns')
def serve_columns():
    excel_file = 'api/addresses.xlsx'
    df = pd.read_excel(excel_file)
    columns = df.columns.tolist()
    return jsonify(columns)

@app.route('/column-values')
def serve_column_values():
    column = request.args.get('column')
    excel_file = 'api/addresses.xlsx'
    df = pd.read_excel(excel_file)
    unique_values = df[column].dropna().unique().tolist()
    return jsonify(unique_values)

@app.route('/data-within-bounds')
def serve_data_within_bounds():
    try:
        northEastLat = request.args.get('northEastLat', type=float)
        northEastLng = request.args.get('northEastLng', type=float)
        southWestLat = request.args.get('southWestLat', type=float)
        southWestLng = request.args.get('southWestLng', type=float)
        filters = request.args.get('filters', '{}')
        filters = json.loads(filters)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 100, type=int)

        logging.info(f"Received bounds: NE({northEastLat}, {northEastLng}), SW({southWestLat}, {southWestLng}), Page: {page}, Per Page: {per_page}, Filters: {filters}")

        excel_file = 'api/addresses.xlsx'
        df = pd.read_excel(excel_file)

        # Apply filters
        for column, filter_info in filters.items():
            if filter_info['search']:
                df = df[df[column].astype(str).str.contains(filter_info['search'], case=False, na=False)]
            if filter_info['values']:
                df = df[df[column].isin(filter_info['values'])]

        # Apply bounds
        df = df[(df['Latitude'] <= northEastLat) & (df['Latitude'] >= southWestLat) & (df['Longitude'] <= northEastLng) & (df['Longitude'] >= southWestLng)]

        # Replace NaN with None
        df = df.where(pd.notnull(df), None)

        # Pagination
        start = (page - 1) * per_page
        end = start + per_page
        data = df.iloc[start:end].to_dict(orient='records')

        # Log first 5 records for debug
        logging.info(f"Data to be sent: {data[:5]}")

        return jsonify(data)
    except Exception as e:
        logging.error(f"Error processing request: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/initial-view')
def initial_view():
    try:
        excel_file = 'api/addresses.xlsx'
        df = pd.read_excel(excel_file)
        df = df.dropna(subset=['Latitude', 'Longitude'])

        # Find the mean location for initial map view
        mean_lat = df['Latitude'].mean()
        mean_lng = df['Longitude'].mean()

        return jsonify({"latitude": mean_lat, "longitude": mean_lng})
    except Exception as e:
        logging.error(f"Error processing initial view: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
