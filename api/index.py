from flask import Flask, jsonify, render_template, request
import pandas as pd
import logging

app = Flask(__name__, template_folder='../templates')

# Configure logging
logging.basicConfig(level=logging.INFO)

@app.route('/')
def serve_index():
    return render_template('index.html')

@app.route('/data')
def serve_data():
    try:
        excel_file = 'api/addresses.xlsx'
        df = pd.read_excel(excel_file)
        logging.info(f"Excel file read successfully. Data: {df.head()}")
        
        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        start = (page - 1) * per_page
        end = start + per_page
        
        data = df.iloc[start:end].to_dict(orient='records')
        logging.info(f"Data to be sent: {data}")
        return jsonify(data)
    except Exception as e:
        logging.error(f"Error reading Excel file: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
