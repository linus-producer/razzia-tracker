const initialMinZoom = window.innerWidth < 768 ? 3 : 6;
const initialZoom = window.innerWidth < 768 ? 3 : 6;

const map = L.map('map', {
    minZoom: initialMinZoom,
    maxZoom: 16,
    maxBounds: [
        [47.0, 5.5],
        [55.1, 15.5]
    ]
}).setView([51.1657, 10.4515], initialZoom);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap & Carto',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

let geoLayer;
fetch('bundeslaender.geojson')
    .then(res => res.json())
    .then(data => {
        geoLayer = L.geoJSON(data, {
            style: {
                color: '#333333',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.3,
                fillColor: '#cccccc'
            }
        }).addTo(map);
        buildFederalFilterUI(data);
    });

function buildFederalFilterUI(geoData) {
    const container = document.getElementById('federalFilterContainer');
    const toggleButton = document.createElement('button');
    toggleButton.innerText = 'Bundesländer auswählen';
    toggleButton.style.padding = '0.5rem';
    toggleButton.style.border = '1px solid #ccc';
    toggleButton.style.backgroundColor = '#f2f2f2';
    toggleButton.style.fontFamily = 'Inter, sans-serif';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.marginBottom = '1rem';
    container.appendChild(toggleButton);

    const listWrapper = document.createElement('div');
    listWrapper.style.display = 'none';
    listWrapper.style.transition = 'max-height 0.3s ease';
    listWrapper.style.overflow = 'hidden';
    container.appendChild(listWrapper);

    geoData.features.forEach(feature => {
        const name = feature.properties.NAME_1;
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.cursor = 'pointer';
        item.style.marginBottom = '0.4rem';

        const box = document.createElement('div');
        box.style.width = '20px';
        box.style.height = '20px';
        box.style.border = '1px solid #333';
        box.style.marginRight = '0.5rem';
        box.style.display = 'flex';
        box.style.alignItems = 'center';
        box.style.justifyContent = 'center';
        box.style.backgroundColor = '#8b1e2e';
        box.dataset.checked = 'true';

        const check = document.createElement('div');
        check.style.width = '12px';
        check.style.height = '12px';
        check.style.backgroundColor = '#ffffff';
        box.appendChild(check);

        const label = document.createElement('span');
        label.innerText = name;
        label.style.fontSize = '0.95rem';

        item.appendChild(box);
        item.appendChild(label);
        listWrapper.appendChild(item);

        item.addEventListener('click', () => {
            if (box.dataset.checked === 'true') {
                box.dataset.checked = 'false';
                box.style.backgroundColor = '#ffffff';
                check.style.display = 'none';
            } else {
                box.dataset.checked = 'true';
                box.style.backgroundColor = '#8b1e2e';
                check.style.display = 'block';
            }
            filterAndRender();
        });
    });

    toggleButton.addEventListener('click', () => {
        if (listWrapper.style.display === 'none') {
            listWrapper.style.display = 'block';
        } else {
            listWrapper.style.display = 'none';
        }
    });
}

function getSelectedFederals() {
    const boxes = document.querySelectorAll('#federalFilterContainer div[data-checked]');
    const names = [];
    boxes.forEach(box => {
        if (box.dataset.checked === 'true') {
            const label = box.parentElement.querySelector('span').innerText;
            names.push(label);
        }
    });
    return names;
}

function getColor(dateStr) {
    const today = new Date();
    const entryDate = new Date(dateStr);
    const diffDays = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return '#8b1e2e';      // dunkles Rot
    /* if (diffDays <= 3) return '#b3541e';      // gedämpftes Orangebraun */
    if (diffDays <= 7) return '#b89e1d';      // gedämpftes Senfgelb
    return '#2c3e75';                         // gedämpftes Dunkelblau
}

let allData = [];
let markers = [];

function clearMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
}

function getColoredIcon(color) {
    const svgIcon = `<svg width="24" height="30" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M24 12C24 18.0965 18.9223 23.1316 13.4384 28.5696C12.961 29.043 12.4805 29.5195 12 30C11.5219 29.5219 11.0411 29.0452 10.5661 28.5741C5.08215 23.1361 0 18.0965 0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12ZM12 16.5C14.4853 16.5 16.5 14.4853 16.5 12C16.5 9.51472 14.4853 7.5 12 7.5C9.51472 7.5 7.5 9.51472 7.5 12C7.5 14.4853 9.51472 16.5 12 16.5Z" fill="${color}"/>
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
    const selectedFederals = getSelectedFederals();

    clearMarkers();

    let count = 0;
    let filteredDates = [];

    const positionOffsetMap = new Map();

    allData.forEach(entry => {
        if (!selectedFederals.includes(entry.federal)) return;
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

        const angle = (offsetIndex * 50) * (Math.PI / 180);
        const ring = Math.floor(offsetIndex / 8);
        const radius = 0.2 + 0.1 * ring;
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
        
        const zIndex = 10000 - Math.floor((new Date() - entryDate) / (1000 * 60 * 60 * 24));
        marker.setZIndexOffset(zIndex);

        marker.addTo(map);
        markers.push(marker);
        count++;
    });

    let infoText = "";
    if (filteredDates.length > 0) {
        const minDate = new Date(Math.min(...filteredDates));
        const maxDate = new Date(Math.max(...filteredDates));
        const days = Math.floor((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
        const formattedMinDate = minDate.toLocaleDateString('de-DE');
        infoText = `${count} in ${days} Tagen`; //\nStartdatum: ${formattedMinDate}
    } else {
        infoText = `${count} Einträge`;
    }

    const entryDisplay = document.getElementById("entryCount");
    entryDisplay.innerText = infoText;
    entryDisplay.style.fontSize = "1.2rem";

    if (geoLayer) {
        geoLayer.eachLayer(layer => {
            const name = layer.feature.properties.NAME_1;
            if (selectedFederals.includes(name)) {
                layer.setStyle({ opacity: 0.8, fillOpacity: 0.3 });
            } else {
                layer.setStyle({ opacity: 0.2, fillOpacity: 0.1 });
            }
        });
    }
}

document.getElementById("startDate").addEventListener("change", filterAndRender);
document.getElementById("endDate").addEventListener("change", filterAndRender);

fetch('https://razzia-tracker.onrender.com/api/raids')
    .then(res => res.json())
    .then(data => {
        allData = data;
        filterAndRender();
    });
