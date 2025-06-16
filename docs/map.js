const map = L.map('map', {
    minZoom: 6,
    maxZoom: 10,
    maxBounds: [
        [47.0, 5.5],
        [55.1, 15.5]
    ]
}).setView([51.1657, 10.4515], 6);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap & Carto',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

function getColor(dateStr) {
    const today = new Date();
    const entryDate = new Date(dateStr);
    const diffDays = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return '#d7263d';      // rot
    if (diffDays <= 3) return '#ff8800';      // orange
    if (diffDays <= 7) return '#ffcc00';      // gelb
    return '#1d4ed8';                         // blau
}

let allData = [];
let markers = [];

function clearMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
}

function getColoredIcon(color) {
    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
        <path d="M15 0C6.7 0 0 6.7 0 15c0 11.3 15 25 15 25s15-13.7 15-25C30 6.7 23.3 0 15 0z" fill="${color}" stroke="#222" stroke-width="1.5"/>
        <circle cx="15" cy="15" r="5" fill="white"/>
    </svg>`;
    return L.divIcon({
        className: '',
        html: svgIcon,
        iconSize: [30, 40],
        iconAnchor: [15, 40],
        popupAnchor: [0, -35]
    });
}

function filterAndRender() {
    const startDateInput = document.getElementById("startDate").value;
    const endDateInput = document.getElementById("endDate").value;
    const startDate = startDateInput ? new Date(startDateInput) : null;
    const endDate = endDateInput ? new Date(endDateInput) : new Date();

    clearMarkers();

    let count = 0;
    let filteredDates = [];

    const positionOffsetMap = new Map();

    allData.forEach(entry => {
        const lat = parseFloat(entry.lat);
        const lon = parseFloat(entry.lon);
        if (isNaN(lat) || isNaN(lon)) return;

        const entryDate = new Date(entry.date);
        if (startDate && entryDate < startDate) return;
        if (endDate && entryDate > endDate) return;

        filteredDates.push(entryDate);

        const key = `${lat},${lon}`;
        const offsetIndex = positionOffsetMap.get(key) || 0;
        positionOffsetMap.set(key, offsetIndex + 1);

        const angle = (offsetIndex * 50) * (Math.PI / 180); // dichter gestreut
        const ring = Math.floor(offsetIndex / 8);           // jeder 8. Marker auf nächstem Ring
        const radius = 0.1 + 0.05 * ring;                  // Start bei 6km, dann +3km pro Ring
        const latOffset = lat + radius * Math.cos(angle);
        const lonOffset = lon + radius * Math.sin(angle);

        const marker = L.marker([latOffset, lonOffset], {
            icon: getColoredIcon(getColor(entry.date))
        });

        marker.bindPopup(`
            <b>${entry.title}</b><br>
            ${entry.summary}<br>
            <a href="${entry.url}" target="_blank">Mehr erfahren</a>
        `);

        marker.addTo(map);
        markers.push(marker);
        count++;
    });

    let timeRange = 0;
    if (filteredDates.length > 0) {
        const minDate = new Date(Math.min(...filteredDates));
        const maxDate = new Date(Math.max(...filteredDates));
        timeRange = Math.floor((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
    }

    const infoText = `${count} in ${timeRange} Tagen`;
    const entryDisplay = document.getElementById("entryCount");
    entryDisplay.innerText = infoText;
    entryDisplay.style.fontSize = "1.5rem";
    entryDisplay.style.fontWeight = "bold";
}

document.getElementById("startDate").addEventListener("change", filterAndRender);
document.getElementById("endDate").addEventListener("change", filterAndRender);

fetch('https://razzia-tracker.onrender.com/api/raids')
    .then(res => res.json())
    .then(data => {
        allData = data;
        filterAndRender();
    });
