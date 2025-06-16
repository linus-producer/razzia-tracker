import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sqlite3

app = FastAPI()
SUPABASE_URL = "https://rbxjghygifiaxgfpybgz.supabase.co"
API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJieGpnaHlnaWZpYXhnZnB5Ymd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjgzOTUsImV4cCI6MjA2NTY0NDM5NX0.Lp-Sx-6mMOidUS8gzfurggbXDXnn2tNbk5BrpWkWqY4"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/raids")
def get_raids():
    headers = {
        "apikey": API_KEY,
        "Authorization": f"Bearer {API_KEY}"
    }
    r = httpx.get(SUPABASE_URL + "?select=*", headers=headers)
    return r.json()