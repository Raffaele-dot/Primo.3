from flask import Flask, jsonify, render_template
import pandas as pd

app = Flask(__name__, template_folder='../templates')

@app.route('/')
def serve_index():
    return render_template('index.html')

@app.route('/data')
def serve_data():
    excel_file = 'api/addresses.xlsx'
    df = pd.read_excel(excel_file)
    data = df.to_dict(orient='records')
    return jsonify(data)
