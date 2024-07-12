from flask import Flask, jsonify, send_from_directory
import pandas as pd

app = Flask(__name__)

# Route to serve the index.html
@app.route('/')
def serve_index():
    return send_from_directory('', 'index.html')

# Route to serve the data
@app.route('/data')
def serve_data():
    excel_file = 'addresses.xlsx'
    df = pd.read_excel(excel_file)
    data = df.to_dict(orient='records')
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
