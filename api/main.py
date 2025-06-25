from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
import smtplib
from email.mime.text import MIMEText

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
SMTP_KEY = os.getenv("SMTP_KEY")

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
    msg["From"] = "no-reply@glueckswirtschaft.de"
    msg["To"] = "linus@producer.works" #+++

    # SMTP-Server
    try:
        with smtplib.SMTP("k75s74.meinserver.io", 587) as server:
            server.starttls()
            server.login("no-reply@glueckswirtschaft.de", SMTP_KEY)
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
        "secret": os.getenv("RECAPTCHA_SECRET_KEY"),  # Im .env setzen
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
