document.addEventListener('DOMContentLoaded', () => {
    // Existing code to initialize the map and markers...

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

    function applyColumnFilter(column) {
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
    }

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
                cacheAndDisplayMarkers(data);
            })
            .catch(error => console.error('Error fetching data with filters:', error));
    }
});
