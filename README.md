# Razzienkarte – Scrapingbasierte Visualisierung von Glücksspiel-Razzien

Ein vollständiges Projekt zur automatisierten Erfassung, Analyse und Darstellung von Polizeimeldungen im Zusammenhang mit illegalem Glücksspiel.

## Funktionen
- Automatisches Scraping aktueller Presseartikel (Presseportal)
- Keyword- und Ortserkennung (spaCy)
- Geokodierung über OpenStreetMap (Nominatim)
- Speicherung in SQLite
- REST-API via FastAPI
- Interaktive Leaflet-Karte mit zeitlich codierten Markern

## Projektstruktur

- `scraper/`: Python-Skript zum Scrapen und Verarbeiten der Daten
- `api/`: FastAPI-Backend zur Bereitstellung der Daten als JSON
- `frontend/`: HTML + JavaScript (Leaflet.js) für die Kartendarstellung
- `db/`: SQLite-Datenbank und SQL-Schema
- `.github/workflows/`: GitHub Actions Workflow für automatische Ausführung

## Setup lokal

### Voraussetzungen
- Python 3.10+
- Internetzugang

### Installation
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m spacy download de_core_news_sm
sqlite3 db/razzien.db < db/schema.sql
```

### Scraper ausführen
```bash
python scraper/scrape.py
```

### API starten
```bash
uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend öffnen
Öffne `frontend/index.html` im Browser.

## Kostenlos deployen (Empfehlung)

- **Scraper**: GitHub Actions (3x täglich)
- **API**: Render.com (kostenloser Web Service)
- **Frontend**: GitHub Pages
- **Geodaten**: OpenStreetMap (Nominatim mit 1s Delay pro Anfrage)

## Lizenz
MIT-Lizenz