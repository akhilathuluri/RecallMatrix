"""
Quick script to set Telegram webhook
Run this after starting the backend server
"""
import requests  # type: ignore
import os
from dotenv import load_dotenv  # type: ignore

load_dotenv()

BACKEND_URL = os.getenv('NEXT_PUBLIC_TELEGRAM_BACKEND_URL', 'http://localhost:8000')

print(f"Setting webhook for backend: {BACKEND_URL}")

try:
    response = requests.post(f"{BACKEND_URL}/api/telegram/set-webhook")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
    print("\nMake sure:")
    print("1. Backend server is running (python main.py)")
    print("2. Ngrok is running and URL is correct in .env")
    print("3. TELEGRAM_WEBHOOK_URL in backend/.env is correct")
