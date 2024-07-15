document.addEventListener('DOMContentLoaded', () => {
    // Fetch column names for filters
    fetch('/columns')
        .then(response => response.json())
        .then(columns => {
            const filterContainer = document.getElementById('filterContainer');
            columns.forEach(column => {
                const columnButton = document.createElement('button');
                columnButton.classList.add('filter-button');
                columnButton.textContent = column;
                columnButton.addEventListener('click', () => openColumnFilter(column));
                filterContainer.insertBefore(columnButton, filterContainer.firstChild);
            });
        });

    function openColumnFilter(column) {
        const filterPopup = document.getElementById('filterPopup');
        const filterContent = document.getElementById('filterContent');
        filterContent.innerHTML = `
            <h3>${column}</h3>
            <input type="text" id="search-${column}" placeholder="Search...">
            <button id="confirm-${column}">Confirm Selection</button>
            <div id="values-${column}" class="filter-values"></div>
        `;
        filterPopup.style.display = 'block';

        document.getElementById(`confirm-${column}`).addEventListener('click', () => {
            const searchValue = document.getElementById(`search-${column}`).value;
            const selectedValues = Array.from(document.querySelectorAll(`#values-${column} input:checked`)).map(input => input.value);
            currentFilters[column] = {
                search: searchValue,
                values: selectedValues
            };
            filterPopup.style.display = 'none';
        });

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
    }

    // Open filters button
    document.getElementById('openFilters').addEventListener('click', () => {
        document.getElementById('filterContainer').style.display = 'block';
        fetching = false; // Stop fetching when filters are opened
    });

    // Apply filters button
    document.getElementById('applyFilters').addEventListener('click', () => {
        document.getElementById('filterContainer').style.display = 'none';
        markersLayer.clearLayers(); // Clear existing markers
        markerCache = {}; // Clear the cache
        fetching = true; // Resume fetching with new filters
        fetchDataWithinBounds(); // Fetch data with new filters
    });
});
