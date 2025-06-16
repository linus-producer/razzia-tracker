import requests
import spacy
import time
from bs4 import BeautifulSoup
from datetime import datetime
from geopy.geocoders import Nominatim
from supabase import create_client
import os

KEYWORDS = ["razzia", "glücksspiel", "spielhalle", "durchsuchung", "illegal"]
NEWS_URL = "https://www.presseportal.de/blaulicht"
DB_PATH = "db/razzien.db"

nlp = spacy.load("de_core_news_sm")
geolocator = Nominatim(user_agent="razzia-map")

SUPABASE_URL = os.getenv("https://rbxjghygifiaxgfpybgz.supabase.co")
SUPABASE_KEY = os.getenv("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJieGpnaHlnaWZpYXhnZnB5Ymd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjgzOTUsImV4cCI6MjA2NTY0NDM5NX0.Lp-Sx-6mMOidUS8gzfurggbXDXnn2tNbk5BrpWkWqY4")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_articles():
    response = requests.get(NEWS_URL)
    soup = BeautifulSoup(response.text, "html.parser")
    articles = soup.select(".news.teaser a.teaser-title")
    return [(a.text.strip(), a['href']) for a in articles[:10]]

def fetch_article_text(url):
    res = requests.get(url)
    soup = BeautifulSoup(res.text, "html.parser")
    paragraphs = soup.select(".article-text p")
    return "\n".join(p.get_text() for p in paragraphs)

def contains_keywords(text):
    text_lower = text.lower()
    return any(kw in text_lower for kw in KEYWORDS)

def extract_location(text):
    doc = nlp(text)
    locations = [ent.text for ent in doc.ents if ent.label_ == "LOC"]
    return locations[0] if locations else None

def geocode_location(location):
    time.sleep(1)
    try:
        geo = geolocator.geocode(location)
        if geo:
            return geo.latitude, geo.longitude
    except Exception:
        return None, None
    return None, None

def save_to_db(data):
    response = supabase.table("raids").insert({
        "title": data[0],
        "summary": data[1],
        "date": data[2],
        "location": data[3],
        "lat": data[4],
        "lon": data[5],
        "url": data[6]
    }).execute()

def main():
    articles = fetch_articles()
    for title, link in articles:
        full_url = f"https://www.presseportal.de{link}"
        content = fetch_article_text(full_url)
        if not contains_keywords(content):
            continue

        location = extract_location(content)
        if not location:
            continue

        lat, lon = geocode_location(location)
        if not lat or not lon:
            continue

        date_str = datetime.utcnow().strftime("%Y-%m-%d")
        summary = content[:300] + "..."
        data = (title, summary, date_str, location, lat, lon, full_url)
        save_to_db(data)

if __name__ == "__main__":
    main()