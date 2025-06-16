const map = L.map('map').setView([51.1657, 10.4515], 6);  // Deutschland-Zentrum

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

function getColor(dateStr) {
    const today = new Date();
    const entryDate = new Date(dateStr);
    const diffDays = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) return 'red';
    if (diffDays <= 14) return 'orange';
    return 'green';
}

fetch('/api/raids')
    .then(res => res.json())
    .then(data => {
        data.forEach(entry => {
            const marker = L.circleMarker([entry.lat, entry.lon], {
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
        });
    });