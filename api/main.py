from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://rbxjghygifiaxgfpybgz.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

@app.get("/api/raids")
def get_raids():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    url = f"{SUPABASE_URL}/rest/v1/raids?select=*"
    response = httpx.get(url, headers=headers)
    return response.json()