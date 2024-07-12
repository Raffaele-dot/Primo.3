from flask import Flask, jsonify, render_template
import pandas as pd

app = Flask(__name__)

@app.route('/')
def serve_index():
    return render_template('index.html')

@app.route('/data')
def serve_data():
    excel_file = 'api/addresses.xlsx'
    df = pd.read_excel(excel_file)
    data = df.to_dict(orient='records')
    return jsonify(data)

# Remove the following lines for Vercel deployment
# if __name__ == '__main__':
#     app.run(debug=True)
