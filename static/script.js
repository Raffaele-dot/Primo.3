document.addEventListener('DOMContentLoaded', () => {
    // Initialize the map
    const map = L.map('map').setView([48.8566, 2.3522], 12); // Set initial view to a location, for example, Paris

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Create a layer group for markers
    const markersLayer = L.layerGroup().addTo(map);

    function fetchMarkers(bounds) {
        const northEast = bounds.getNorthEast();
        const southWest = bounds.getSouthWest();
        const url = `/data-within-bounds?northEastLat=${northEast.lat}&northEastLng=${northEast.lng}&southWestLat=${southWest.lat}&southWestLng=${southWest.lng}&page=1&per_page=100`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                markersLayer.clearLayers();
                data.forEach(markerData => {
                    L.marker([markerData.Latitude, markerData.Longitude])
                        .bindPopup(markerData.Address) // Customize the popup as needed
                        .addTo(markersLayer);
                });
            })
            .catch(error => console.error('Error fetching markers:', error));
    }

    // Fetch initial markers
    fetchMarkers(map.getBounds());

    // Fetch markers on map move end
    map.on('moveend', () => {
        fetchMarkers(map.getBounds());
    });

    // Filter popup logic
    const openFilterPopup = document.getElementById('open-filter-popup');
    const filterPopup = document.getElementById('filter-popup');
    const filterHeaders = document.getElementById('filter-headers');
    const filterConditions = document.getElementById('filter-conditions');
    const applyFiltersButton = document.getElementById('apply-filters');

    let filters = {};

    openFilterPopup.addEventListener('click', () => {
        fetch('/columns')
            .then(response => response.json())
            .then(columns => {
                filterHeaders.innerHTML = '';
                columns.forEach(column => {
                    const headerButton = document.createElement('button');
                    headerButton.textContent = column;
                    headerButton.addEventListener('click', () => openColumnFilter(column));
                    filterHeaders.appendChild(headerButton);
                });
                filterPopup.style.display = 'block';
            })
            .catch(error => console.error('Error fetching columns:', error));
    });

    function openColumnFilter(column) {
        filterConditions.innerHTML = `<h3>${column}</h3>
            <input type="text" id="search-${column}" placeholder="Search...">
            <div id="values-${column}">
                <!-- Dynamically populated column values -->
            </div>
            <button onclick="applyColumnFilter('${column}')">Confirm Selection</button>`;

        // Fetch unique values for the column
        fetch(`/column-values?column=${column}`)
            .then(response => response.json())
            .then(values => {
                const valuesDiv = document.getElementById(`values-${column}`);
                valuesDiv.innerHTML = '<label><input type="checkbox" id="select-all" checked>Select All</label>';
                values.forEach(value => {
                    const valueLabel = document.createElement('label');
                    valueLabel.innerHTML = `<input type="checkbox" value="${value}" checked> ${value}`;
                    valuesDiv.appendChild(valueLabel);
                });
            })
            .catch(error => console.error('Error fetching column values:', error));
    }

    window.applyColumnFilter = function(column) {
        const searchInput = document.getElementById(`search-${column}`);
        const checkboxes = document.querySelectorAll(`#values-${column} input[type="checkbox"]:not(#select-all)`);
        let selectedValues = [];
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                selectedValues.push(checkbox.value);
            }
        });

        filters[column] = {
            search: searchInput.value,
            values: selectedValues
        };
    };

    applyFiltersButton.addEventListener('click', () => {
        fetchDataWithFilters();
        filterPopup.style.display = 'none';
    });

    function fetchDataWithFilters() {
        const bounds = map.getBounds();
        const northEast = bounds.getNorthEast();
        const southWest = bounds.getSouthWest();
        let url = `/data-within-bounds?northEastLat=${northEast.lat}&northEastLng=${northEast.lng}&southWestLat=${southWest.lat}&southWestLng=${southWest.lng}&filters=${JSON.stringify(filters)}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                markersLayer.clearLayers();
                data.forEach(markerData => {
                    L.marker([markerData.Latitude, markerData.Longitude])
                        .bindPopup(markerData.Address) // Customize the popup as needed
                        .addTo(markersLayer);
                });
            })
            .catch(error => console.error('Error fetching data with filters:', error));
    }
});
