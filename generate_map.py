import pandas as pd
import folium
import requests

def geocode_address(address):
    api_key = 'YOUR_GOOGLE_MAPS_API_KEY'  # Replace with your API key
    base_url = 'https://maps.googleapis.com/maps/api/geocode/json'
    response = requests.get(base_url, params={'address': address, 'key': api_key})
    results = response.json().get('results')
    if results:
        location = results[0]['geometry']['location']
        return location['lat'], location['lng']
    return None, None

# Load the Excel file
excel_file = 'addresses.xlsx'
df = pd.read_excel(excel_file)

# Check if Latitude and Longitude columns are missing
if 'Latitude' not in df.columns or 'Longitude' not in df.columns:
    df['Latitude'] = None
    df['Longitude'] = None
    for idx, row in df.iterrows():
        lat, lon = geocode_address(row['Address'])
        df.at[idx, 'Latitude'] = lat
        df.at[idx, 'Longitude'] = lon
    df.to_excel(excel_file, index=False)  # Update the Excel file with new columns

# Create a map centered around the first address
map_center = [df.iloc[0]['Latitude'], df.iloc[0]['Longitude']]
my_map = folium.Map(location=map_center, zoom_start=10)

# Add each address to the map
for _, row in df.iterrows():
    folium.Marker(
        location=[row['Latitude'], row['Longitude']],
        popup=row['Address']
    ).add_to(my_map)

# Save the map to an HTML file
output_map = 'index.html'
my_map.save(output_map)
print(f"Map has been saved to {output_map}")
