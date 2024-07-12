document.addEventListener('DOMContentLoaded', () => {
    var map = L.map('map').setView([48.1486, 17.1077], 10); // Default to Bratislava

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Marker layer group
    var markersLayer = L.layerGroup().addTo(map);
    var allData = [];
    var maxMarkers = 100; // Adjust this number as needed

    // Fetch data
    function fetchDataAndDisplay() {
        fetch('/data')
            .then(response => response.json())
            .then(data => {
                allData = data; // Store all data
                updateMarkers(); // Initial display of markers
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }

    // Update markers based on current map bounds and zoom level
    function updateMarkers() {
        markersLayer.clearLayers(); // Clear existing markers
        var bounds = map.getBounds();
        var count = 0;
        for (var i = 0; i < allData.length; i++) {
            if (count >= maxMarkers) break;
            var item = allData[i];
            if (item.Latitude && item.Longitude) {
                var latLng = [item.Latitude, item.Longitude];
                if (bounds.contains(latLng)) {
                    var popupContent = `
                        <b>Title:</b> ${item.Title}<br>
                        <b>URL:</b> <a href="${item.Title_URL}" target="_blank">${item.Title_URL}</a><br>
                        <b>Rooms (m²):</b> ${item.Rooms_mtrsqrd}<br>
                        <b>Area (m²):</b> ${item.Mtrsqrd}<br>
                        <b>Description:</b> ${item.Description}<br>
                        <b>Neighborhood:</b> ${item.Neighborhood}<br>
                        <b>Price per m²:</b> ${item.Price_mtrsq}<br>
                        <b>Price:</b> ${item.Price}<br>
                    `;
                    var marker = L.marker(latLng).bindPopup(popupContent);
                    markersLayer.addLayer(marker);
                    count++;
                }
            }
        }
    }

    // Event listeners for zoom and moveend to update markers
    map.on('zoomend', updateMarkers);
    map.on('moveend', updateMarkers);

    // Initial data load
    fetchDataAndDisplay();
});
