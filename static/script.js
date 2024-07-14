document.addEventListener('DOMContentLoaded', () => {
    var map = L.map('map').setView([48.1486, 17.1077], 10); // Default to Bratislava

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Marker layer group
    var markerCache = {};
    var markersLayer = L.layerGroup().addTo(map);

    // Filters
    var filters = {};

    // Function to fetch data based on the current map bounds
    function fetchDataWithinBounds(page = 1, per_page = 100) {
        var bounds = map.getBounds();
        var northEast = bounds.getNorthEast();
        var southWest = bounds.getSouthWest();
        var url = `/data-within-bounds?northEastLat=${northEast.lat}&northEastLng=${northEast.lng}&southWestLat=${southWest.lat}&southWestLng=${southWest.lng}&page=${page}&per_page=${per_page}&filters=${encodeURIComponent(JSON.stringify(filters))}`;
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

    // Function to cache and display markers
    function cacheAndDisplayMarkers(data) {
        data.forEach(item => {
            if (item.Latitude && item.Longitude) {
                var key = `${item.Latitude}-${item.Longitude}`;
                if (!markerCache[key]) {
                    var popupContent = `
                        <b>Title:</b> ${item.Title || 'N/A'}<br>
                        <b>URL:</b> <a href="${item.Title_URL || '#'}" target="_blank">${item.Title_URL || 'N/A'}</a><br>
                        <b>Apt/house type:</b> ${item['Apt/house type'] || 'N/A'}<br>
                        <b>Area (m²): ${item.Mtrsqrd || 'N/A'}</b><br>
                        <b>Description:</b> ${item.Description || 'N/A'}<br>
                        <b>Neighborhood:</b> ${item.Neighborhood || 'N/A'}<br>
                        <b>Price per m²:</b> ${item.Price_mtrsq || 'N/A'}<br>
                        <b>Price:</b> ${item.Price || 'N/A'}<br>
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

    // Filter logic
    document.getElementById('open-filter').addEventListener('click', () => {
        fetch('/columns')
            .then(response => response.json())
            .then(columns => {
                var filterPopup = document.getElementById('filter-popup');
                var filterContainer = document.getElementById('filter-container');
                filterContainer.innerHTML = '';

                columns.forEach(column => {
                    var columnDiv = document.createElement('div');
                    columnDiv.innerHTML = `<b>${column}</b>`;
                    columnDiv.addEventListener('click', () => {
                        fetch(`/column-values?column=${column}`)
                            .then(response => response.json())
                            .then(values => {
                                filterContainer.innerHTML = `<b>${column}</b>`;
                                var searchInput = document.createElement('input');
                                searchInput.type = 'text';
                                searchInput.placeholder = 'Search...';
                                filterContainer.appendChild(searchInput);

                                var valuesContainer = document.createElement('div');
                                valuesContainer.style.maxHeight = '200px';
                                valuesContainer.style.overflowY = 'scroll';
                                valuesContainer.style.display = 'flex';
                                valuesContainer.style.flexDirection = 'column';
                                valuesContainer.style.flexWrap = 'nowrap';
                                valuesContainer.style.width = '100%';
                                valuesContainer.style.height = '100px';
                                valuesContainer.style.border = '1px solid #ccc';
                                valuesContainer.style.padding = '10px';
                                valuesContainer.style.boxSizing = 'border-box';

                                values.forEach(value => {
                                    var valueDiv = document.createElement('div');
                                    valueDiv.style.display = 'flex';
                                    valueDiv.style.alignItems = 'center';
                                    var checkbox = document.createElement('input');
                                    checkbox.type = 'checkbox';
                                    checkbox.value = value;
                                    valueDiv.appendChild(checkbox);
                                    valueDiv.appendChild(document.createTextNode(value));
                                    valuesContainer.appendChild(valueDiv);
                                });

                                var confirmButton = document.createElement('button');
                                confirmButton.textContent = 'Confirm Selection';
                                confirmButton.style.display = 'block';
                                confirmButton.style.marginTop = '10px';
                                confirmButton.addEventListener('click', () => {
                                    var selectedValues = Array.from(valuesContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
                                    filters[column] = {
                                        search: searchInput.value,
                                        values: selectedValues
                                    };
                                    filterContainer.innerHTML = '';
                                });

                                filterContainer.appendChild(valuesContainer);
                                filterContainer.appendChild(confirmButton);
                            });
                    });
                    filterContainer.appendChild(columnDiv);
                });

                filterPopup.style.display = 'block';
            });
    });

    document.getElementById('apply-filters').addEventListener('click', () => {
        fetchDataWithinBounds();
        document.getElementById('filter-popup').style.display = 'none';
    });
});
