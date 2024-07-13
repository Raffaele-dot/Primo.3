from flask import Flask, jsonify, render_template, request
import pandas as pd
import logging

app = Flask(__name__, template_folder='../templates', static_folder='../static')

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
        
        logging.info(f"Received bounds: NE({northEastLat}, {northEastLng}), SW({southWestLat}, {southWestLng})")

        excel_file = 'api/addresses.xlsx'
        df = pd.read_excel(excel_file)
        logging.info(f"Excel file read successfully. Data: {df.head()}")

        # Replace NaN values with empty strings
        df = df.fillna("")

        # Filter data within bounds
        df = df[(df['Latitude'] >= southWestLat) & (df['Latitude'] <= northEastLat) & (df['Longitude'] >= southWestLng) & (df['Longitude'] <= northEastLng)]

        data = df.to_dict(orient='records')
        logging.info(f"Filtered data to be sent: {data}")
        return jsonify(data)
    except Exception as e:
        logging.error(f"Error processing request: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
