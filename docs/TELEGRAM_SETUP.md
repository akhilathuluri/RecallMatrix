# Telegram Bot Integration - Setup Guide

## 📋 Overview

The MemoryVault Telegram Bot allows users to manage their memories directly from Telegram. Users can add, view, search memories, and upload files through the bot interface.

## 🏗️ Architecture

### Components

1. **Python Backend** (`/backend`): FastAPI server handling Telegram webhook and business logic
2. **Next.js API Routes** (`/app/api/telegram`): Integration layer between frontend and Python backend
3. **Database**: PostgreSQL with pgvector extension (Supabase)
4. **Telegram Bot API**: Official Telegram Bot API for message handling

### Data Flow

```
Telegram User → Telegram Bot API → Python Backend (FastAPI)
                                           ↓
                                    Generate Embeddings
                                           ↓
                                    Supabase Database
                                           ↑
Next.js Frontend ← Next.js API Routes ←───┘
```

## 🚀 Setup Instructions

### 1. Create Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow prompts to create your bot:
   - Choose a name (e.g., "MemoryVault Bot")
   - Choose a username (e.g., "MemoryVaultBot")
4. Save the **Bot Token** provided by BotFather

### 2. Database Migration

Run the Telegram integration migration:

```bash
# Connect to your Supabase database
psql postgresql://your-connection-string

# Run migration
\i supabase/migrations/20251126000000_add_telegram_integration.sql
```

Or use Supabase CLI:

```bash
supabase migration up
```

### 3. Configure Python Backend

1. Navigate to backend directory:

```bash
cd backend
```

2. Create virtual environment:

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create `.env` file from template:

```bash
cp .env.example .env
```

5. Configure environment variables in `.env`:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook

# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# GitHub Models API
GITHUB_TOKEN=your_github_token
GITHUB_MODELS_ENDPOINT=https://models.inference.ai.azure.com

# Application
APP_BASE_URL=https://your-app-domain.com
API_SECRET_KEY=your_random_secret_key_32_chars
AUTH_CODE_EXPIRY_MINUTES=10
ENVIRONMENT=production
LOG_LEVEL=INFO
```

### 4. Configure Next.js Frontend

Add to your Next.js `.env.local`:

```env
# Telegram Backend
NEXT_PUBLIC_TELEGRAM_BACKEND_URL=https://your-python-backend-url.com
TELEGRAM_API_SECRET_KEY=same_as_python_backend_api_secret_key
```

### 5. Deploy Python Backend

#### Option A: Local Development

```bash
cd backend
python main.py
```

Backend runs on `http://localhost:8000`

#### Option B: Production Deployment (Railway/Render/etc.)

1. Push code to GitHub
2. Create new service on your platform
3. Set environment variables
4. Deploy from GitHub

**Important:** After deployment, set the webhook:

```bash
curl -X POST https://your-python-backend-url.com/api/telegram/set-webhook
```

### 6. Deploy Next.js Frontend

Deploy as usual with Vercel/Netlify, ensuring environment variables are set.

## 🔧 Testing

### Test Bot Locally

For development, use polling instead of webhooks:

```python
# In main.py, modify initialization:
await telegram_service.start_polling()  # Instead of webhook
```

### Test Bot Commands

1. Open Telegram
2. Search for your bot username
3. Send `/start` command
4. Test authentication flow

## 📱 User Flow

### Connecting Account

1. User visits MemoryVault → Integrations → Telegram
2. Click "Generate Connection Code"
3. 6-digit code is generated (valid for 10 minutes)
4. User opens Telegram bot
5. Sends `/connect CODE123`
6. Bot verifies code and links accounts
7. User receives confirmation

### Using Bot

**Available Commands:**

- `/start` - Welcome message and instructions
- `/connect <code>` - Link MemoryVault account
- `/status` - Check connection status
- `/add` - Instructions to add memories
- `/list` - View recent 10 memories
- `/search <query>` - Search memories
- `/help` - Show help message

**Adding Memories:**

- Send any text message → Creates text memory
- Send photo with caption → Creates photo memory
- Send document → Creates document memory

**Automatic Features:**

- Embeddings generated automatically for all memories
- Memories synced in real-time with web app
- Search uses semantic similarity (RAG)

## 🔐 Security

### Authentication Flow

1. 6-character alphanumeric code generated
2. Code expires after 10 minutes
3. Code can only be used once
4. Each Telegram account can only connect to one MemoryVault account
5. API calls secured with API key

### Database Security

- Row Level Security (RLS) enabled
- Users can only access their own data
- Service role key used for bot operations
- All queries parameterized (SQL injection protection)

## 🐛 Troubleshooting

### Bot Not Responding

1. Check webhook is set correctly:
   ```bash
   curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
   ```

2. Check backend logs:
   ```bash
   # View logs in your deployment platform
   ```

3. Test health endpoint:
   ```bash
   curl https://your-backend-url.com/health/detailed
   ```

### Embeddings Not Generating

1. Verify GitHub token is valid
2. Check `GITHUB_MODELS_ENDPOINT` is correct
3. Monitor backend logs for API errors

### Connection Code Not Working

1. Check code hasn't expired (10 minutes)
2. Verify code entered correctly (case-sensitive)
3. Ensure user is authenticated in web app
4. Check database connection

### Memories Not Syncing

1. Verify Telegram connection is active
2. Check database permissions
3. Monitor backend logs
4. Verify webhook is receiving updates

## 📊 Monitoring

### Health Checks

- **Basic**: `GET /health`
- **Detailed**: `GET /health/detailed`

### Logs

Backend uses `loguru` for structured logging:

```python
# Log levels: DEBUG, INFO, WARNING, ERROR
# Configured via LOG_LEVEL environment variable
```

### Metrics to Monitor

- Auth code generation rate
- Connection success rate
- Memory creation rate from Telegram
- Embedding generation success rate
- Webhook response time

## 🔄 Maintenance

### Cleanup Tasks

Run periodically to clean expired codes:

```sql
SELECT cleanup_expired_auth_codes();
```

### Backup Connections

```sql
SELECT * FROM telegram_connections WHERE is_active = true;
```

## 🚦 Rate Limits

### Telegram API Limits

- 30 messages per second per bot
- 20 messages per minute per chat

### GitHub Models API Limits

- Check your GitHub token rate limits
- Consider caching embeddings

## 📚 Additional Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [python-telegram-bot Documentation](https://docs.python-telegram-bot.org/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Supabase Documentation](https://supabase.com/docs)

## 🆘 Support

For issues or questions:

1. Check logs first
2. Review troubleshooting section
3. Verify all environment variables
4. Test each component separately
5. Check database migrations applied

## 📝 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather | `123456:ABC-DEF...` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `GITHUB_TOKEN` | GitHub personal access token | `ghp_...` |
| `API_SECRET_KEY` | Random secret for API auth | `your-secret-key` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_CODE_EXPIRY_MINUTES` | `10` | Code expiration time |
| `AUTH_CODE_LENGTH` | `6` | Length of auth codes |
| `LOG_LEVEL` | `INFO` | Logging level |
| `ENVIRONMENT` | `development` | Environment mode |

## ✅ Deployment Checklist

- [ ] Telegram bot created via BotFather
- [ ] Database migration applied
- [ ] Python backend deployed
- [ ] Webhook configured
- [ ] Next.js environment variables set
- [ ] Frontend deployed
- [ ] Health check passing
- [ ] Test bot connection flow
- [ ] Test memory creation
- [ ] Test memory search
- [ ] Monitor logs for errors
- [ ] Set up backup/monitoring
