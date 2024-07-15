document.addEventListener('DOMContentLoaded', () => {
    var map = L.map('map').setView([48.1486, 17.1077], 10); // Default to Bratislava

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var markerCache = {};
    var markersLayer = L.layerGroup().addTo(map);
    var fetching = true; // Flag to control fetching
    var currentFilters = {}; // Store current filters

    function fetchDataWithinBounds(page = 1, per_page = 100) {
        if (!fetching) return; // Stop fetching if the flag is false

        var bounds = map.getBounds();
        var northEast = bounds.getNorthEast();
        var southWest = bounds.getSouthWest();
        var filters = encodeURIComponent(JSON.stringify(currentFilters));
        var url = `/data-within-bounds?northEastLat=${northEast.lat}&northEastLng=${northEast.lng}&southWestLat=${southWest.lat}&southWestLng=${southWest.lng}&page=${page}&per_page=${per_page}&filters=${filters}`;
        console.log(`Fetching data from: ${url}`);

        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log('Data received:', data);
                if (data.error) {
                    console.error('Error fetching data:', data.error);
                    return;
                }
                cacheAndDisplayMarkers(data);

                // If there is more data, fetch the next page
                if (data.length === per_page) {
                    fetchDataWithinBounds(page + 1, per_page);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }

    function cacheAndDisplayMarkers(data) {
        data.forEach(item => {
            if (item.Latitude && item.Longitude) {
                var key = `${item.Latitude}-${item.Longitude}`;
                if (!markerCache[key]) {
                    var popupContent = `
                        <b>Title:</b> ${item.Title}<br>
                        <b>URL:</b> <a href="${item.Title_URL}" target="_blank">${item.Title_URL}</a><br>
                        <b>Apt/house type:</b> ${item['Apt/house type']}<br>
                        <b>Mtrsqrd:</b> ${item.Mtrsqrd}<br>
                        <b>Description:</b> ${item.Description}<br>
                        <b>Neighborhood:</b> ${item.Neighborhood}<br>
                        <b>Price per m²:</b> ${item.Price_mtrsq}<br>
                        <b>Price:</b> ${item.Price}<br>
                        <b>Address:</b> ${item.Address}<br>
                    `;
                    var marker = L.marker([item.Latitude, item.Longitude]).bindPopup(popupContent);
                    markerCache[key] = marker;
                    markersLayer.addLayer(marker);
                }
            }
        });
    }

    // Initial data load
    fetchDataWithinBounds();

    // Update markers on zoom or move end
    map.on('zoomend', () => fetchDataWithinBounds());
    map.on('moveend', () => fetchDataWithinBounds());
});
