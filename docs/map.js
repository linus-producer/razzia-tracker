
const map = L.map('map', {
    minZoom: 6,
    maxZoom: 10,
    maxBounds: [
        [47.0, 5.5],
        [55.1, 15.5]
    ]
}).setView([51.1657, 10.4515], 6);

// Nutze eine schlichte Kartenbasis ohne Topografie (Carto Light ohne Höhenlinien)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap & Carto',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

function getColor(dateStr) {
    const today = new Date();
    const entryDate = new Date(dateStr);
    const diffDays = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return 'red';
    if (diffDays <= 3) return 'orange';
    return 'green';
}

fetch('https://razzia-tracker.onrender.com/api/raids')
    .then(res => res.json())
    .then(data => {
        let count = 0;
        data.forEach(entry => {
            const lat = parseFloat(entry.lat);
            const lon = parseFloat(entry.lon);
            if (isNaN(lat) || isNaN(lon)) {
                console.warn("Ungültige Koordinaten:", entry);
                return;
            }

            const marker = L.circleMarker([lat, lon], {
                radius: 8,
                fillColor: getColor(entry.date),
                color: '#000',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map);

            marker.bindPopup(`
                <b>${entry.title}</b><br>
                ${entry.summary}<br>
                <a href="${entry.url}" target="_blank">Mehr erfahren</a>
            `);

            count++;
        });
        document.getElementById("entryCount").innerText = count;
    });