from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv

# .env laden
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase-Einstellungen
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://rbxjghygifiaxgfpybgz.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# SMTP-Einstellungen
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_TO = os.getenv("SMTP_TO")

# reCAPTCHA
RECAPTCHA_SECRET_KEY = os.getenv("RECAPTCHA_SECRET_KEY")

@app.get("/api/raids")
def get_raids():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    url = f"{SUPABASE_URL}/rest/v1/raids?select=*"
    response = httpx.get(url, headers=headers)
    return response.json()

# Model für eingehende Meldung
class Report(BaseModel):
    message: str
    source: str
    captcha: str

# E-Mail Versand
def send_email(message: str, source: str):
    email_content = f"""
Neue Meldung eingegangen:

Meldung:
{message}

Quelle:
{source}
"""

    msg = MIMEText(email_content)
    msg["Subject"] = "Neue Razzia-Meldung"
    msg["From"] = SMTP_USER
    msg["To"] = SMTP_TO

    # SMTP-Server
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        print(f"Fehler beim E-Mail-Versand: {e}")
        raise HTTPException(status_code=500, detail="E-Mail konnte nicht gesendet werden.")

@app.post("/api/report")
def receive_report(report: Report):
    if not report.message or not report.source or not report.captcha:
        raise HTTPException(status_code=400, detail="Alle Felder müssen ausgefüllt sein.")

    # reCAPTCHA-Token prüfen
    verify_url = "https://www.google.com/recaptcha/api/siteverify"
    payload = {
        "secret": RECAPTCHA_SECRET_KEY,
        "response": report.captcha
    }

    try:
        recaptcha_response = httpx.post(verify_url, data=payload)
        result = recaptcha_response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Captcha-Verifizierung fehlgeschlagen.")

    if not result.get("success") or result.get("score", 0) < 0.5:
        raise HTTPException(status_code=403, detail="Captcha ungültig oder Score zu niedrig.")

    # Wenn OK → E-Mail senden
    send_email(report.message, report.source)
    return {"status": "ok"}
