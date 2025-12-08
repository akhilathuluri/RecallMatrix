# Python Backend Quick Start

## Local Development

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your values

# Run server
python main.py
```

Server runs at `http://localhost:8000`

## Docker Deployment (Optional)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```bash
docker build -t memoryvault-telegram-bot .
docker run -p 8000:8000 --env-file .env memoryvault-telegram-bot
```

## API Endpoints

- `GET /` - Service info
- `GET /health` - Health check
- `GET /health/detailed` - Detailed health check
- `POST /api/telegram/webhook` - Telegram webhook
- `POST /api/telegram/set-webhook` - Configure webhook
- `POST /api/telegram/generate-auth-code` - Generate auth code
- `GET /api/telegram/connection-status/{user_id}` - Get connection status
- `POST /api/telegram/disconnect/{user_id}` - Disconnect account

## Testing

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test bot info
curl http://localhost:8000/api/telegram/bot-info
```
