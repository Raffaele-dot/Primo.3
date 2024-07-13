document.addEventListener('DOMContentLoaded', () => {
    var map = L.map('map').setView([48.1486, 17.1077], 10); // Default to Bratislava

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Marker layer group
    var layers = {};
    var currentLayer = null;

    // Function to fetch data based on the current map bounds
    function fetchDataWithinBounds() {
        var bounds = map.getBounds();
        var northEast = bounds.getNorthEast();
        var southWest = bounds.getSouthWest();
        var url = `/data-within-bounds?northEastLat=${northEast.lat}&northEastLng=${northEast.lng}&southWestLat=${southWest.lat}&southWestLng=${southWest.lng}`;
        console.log(`Fetching data from: ${url}`);

        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log('Data received:', data);
                updateMarkers(data);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }

    // Function to update markers on the map
    function updateMarkers(data) {
        if (currentLayer) {
            map.removeLayer(currentLayer);
        }

        currentLayer = L.layerGroup();

        data.forEach(item => {
            if (item.Latitude && item.Longitude) {
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
                var marker = L.marker([item.Latitude, item.Longitude]).bindPopup(popupContent);
                currentLayer.addLayer(marker);
            }
        });

        currentLayer.addTo(map);
    }

    // Initial data load
    fetchDataWithinBounds();

    // Update markers on zoom or move end
    map.on('zoomend', fetchDataWithinBounds);
    map.on('moveend', fetchDataWithinBounds);
});
