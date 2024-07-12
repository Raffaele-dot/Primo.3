document.addEventListener('DOMContentLoaded', () => {
    var map = L.map('map').setView([48.1486, 17.1077], 10); // Default to Bratislava

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Marker layer group
    var markersLayer = L.layerGroup().addTo(map);
    var currentPage = 1;
    var maxMarkersPerPage = 100; // Adjust this number as needed

    // Fetch data with pagination
    function fetchDataAndDisplay(page = 1) {
        fetch(`/data?page=${page}&per_page=${maxMarkersPerPage}`)
            .then(response => response.json())
            .then(data => {
                displayMarkers(data);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }

    // Display markers on the map
    function displayMarkers(data) {
        markersLayer.clearLayers(); // Clear existing markers
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
                markersLayer.addLayer(marker);
            }
        });
    }

    // Event listeners for zoom and moveend to update markers
    map.on('zoomend', () => {
        fetchDataAndDisplay(currentPage);
    });
    map.on('moveend', () => {
        fetchDataAndDisplay(currentPage);
    });

    // Initial data load
    fetchDataAndDisplay();
});
