import pandas as pd
import folium

# Load the Excel file
excel_file = 'addresses.xlsx'
df = pd.read_excel(excel_file)

# Assuming the Excel file has columns 'Address', 'Latitude', and 'Longitude'
# Remove rows where latitude or longitude is missing
addresses = df.dropna(subset=['Latitude', 'Longitude'])

# Create a map centered around the first address
map_center = [addresses.iloc[0]['Latitude'], addresses.iloc[0]['Longitude']]
my_map = folium.Map(location=map_center, zoom_start=10)

# Add each address to the map
for _, row in addresses.iterrows():
    folium.Marker(
        location=[row['Latitude'], row['Longitude']],
        popup=row['Address']
    ).add_to(my_map)

# Save the map to an HTML file
output_map = 'map.html'
my_map.save(output_map)
print(f"Map has been saved to {output_map}")
