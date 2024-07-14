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
        markersLayer.clearLayers(); // Clear existing markers
        markerCache = {}; // Clear the cache

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

    // Fetch column names for filters
    fetch('/columns')
        .then(response => response.json())
        .then(columns => {
            const filterContainer = document.getElementById('filterContainer');
            columns.forEach(column => {
                const columnDiv = document.createElement('div');
                columnDiv.classList.add('filter-column');
                columnDiv.innerHTML = `
                    <label>${column}</label>
                    <input type="text" id="search-${column}" placeholder="Search...">
                    <button id="confirm-${column}">Confirm Selection</button>
                    <div id="values-${column}" class="filter-values"></div>
                `;
                filterContainer.appendChild(columnDiv);

                // Add event listeners for confirm buttons
                document.getElementById(`confirm-${column}`).addEventListener('click', () => {
                    const searchValue = document.getElementById(`search-${column}`).value;
                    const selectedValues = Array.from(document.querySelectorAll(`#values-${column} input:checked`)).map(input => input.value);
                    currentFilters[column] = {
                        search: searchValue,
                        values: selectedValues
                    };
                    // Remove values and search bar from view after confirming selection
                    document.getElementById(`values-${column}`).innerHTML = '';
                    document.getElementById(`search-${column}`).value = '';
                });

                // Add event listener for search inputs
                document.getElementById(`search-${column}`).addEventListener('input', (e) => {
                    const searchValue = e.target.value;
                    fetch(`/column-values?column=${column}`)
                        .then(response => response.json())
                        .then(values => {
                            const filteredValues = values.filter(value => value.toString().toLowerCase().includes(searchValue.toLowerCase()));
                            const valuesDiv = document.getElementById(`values-${column}`);
                            valuesDiv.innerHTML = `
                                <div><input type="checkbox" id="select-all-${column}" checked>Select All</div>
                                ${filteredValues.map(value => `<div><input type="checkbox" value="${value}" checked> ${value}</div>`).join('')}
                            `;
                            document.getElementById(`select-all-${column}`).addEventListener('change', (e) => {
                                const checkboxes = valuesDiv.querySelectorAll('input[type="checkbox"]');
                                checkboxes.forEach(checkbox => {
                                    checkbox.checked = e.target.checked;
                                });
                            });
                        });
                });
            });
        });

    // Open filters button
    document.getElementById('openFilters').addEventListener('click', () => {
        document.getElementById('filterContainer').style.display = 'block';
        fetching = false; // Stop fetching when filters are opened
    });

    // Apply filters button
    document.getElementById('applyFilters').addEventListener('click', () => {
        document.getElementById('filterContainer').style.display = 'none';
        fetching = true; // Restart fetching with new filters
        markersLayer.clearLayers(); // Clear existing markers
        markerCache = {}; // Clear the cache
        fetchDataWithinBounds(); // Fetch data with new filters
    });
});
