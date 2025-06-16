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
let markerGroup = L.markerClusterGroup();
map.addLayer(markerGroup);

function createCustomIcon(color) {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="marker-glow" style="background:${color};"></div>`
    });
}

function filterAndRender() {
    const startDateInput = document.getElementById("startDate").value;
    const endDateInput = document.getElementById("endDate").value;
    const startDate = startDateInput ? new Date(startDateInput) : null;
    const endDate = endDateInput ? new Date(endDateInput) : null;

    markerGroup.clearLayers();

    let count = 0;
    allData.forEach(entry => {
        const lat = parseFloat(entry.lat);
        const lon = parseFloat(entry.lon);
        if (isNaN(lat) || isNaN(lon)) return;

        const entryDate = new Date(entry.date);
        if (startDate && entryDate < startDate) return;
        if (endDate && entryDate > endDate) return;

        const marker = L.marker([lat, lon], {
            icon: createCustomIcon(getColor(entry.date))
        });

        marker.bindPopup(`
            <b>${entry.title}</b><br>
            ${entry.summary}<br>
            <a href="${entry.url}" target="_blank">Mehr erfahren</a>
        `);

        marker.on("mouseover", function () {
            this.openPopup();
        });
        marker.on("mouseout", function () {
            this.closePopup();
        });

        markerGroup.addLayer(marker);
        count++;
    });

    document.getElementById("entryCount").innerText = count;
}

document.getElementById("startDate").addEventListener("change", filterAndRender);
document.getElementById("endDate").addEventListener("change", filterAndRender);

fetch('https://razzia-tracker.onrender.com/api/raids')
    .then(res => res.json())
    .then(data => {
        allData = data;
        filterAndRender();
    });

// Stil für Marker hinzufügen
const style = document.createElement('style');
style.textContent = `
.custom-div-icon .marker-glow {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
    transition: transform 0.15s ease, box-shadow 0.3s ease;
    cursor: pointer;
    opacity: 0.9;
}
.custom-div-icon:hover .marker-glow {
    transform: scale(1.3);
    box-shadow: 0 0 12px rgba(0, 0, 0, 0.5);
    opacity: 1;
}`;
document.head.appendChild(style);
