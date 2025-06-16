from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sqlite3

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/raids")
def get_raids():
    conn = sqlite3.connect("db/razzien.db")
    cursor = conn.cursor()
    cursor.execute("SELECT title, summary, date, location, lat, lon, url FROM raids ORDER BY date DESC")
    rows = cursor.fetchall()
    conn.close()

    raids = [
        {
            "title": row[0],
            "summary": row[1],
            "date": row[2],
            "location": row[3],
            "lat": row[4],
            "lon": row[5],
            "url": row[6],
        }
        for row in rows
    ]
    return raids