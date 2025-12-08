# Telegram Bot Integration - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MEMORYVAULT SYSTEM                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐              ┌──────────────────────┐            │
│  │   Web Browser        │              │   Telegram App       │            │
│  │  (Desktop/Mobile)    │              │  (Desktop/Mobile)    │            │
│  │                      │              │                      │            │
│  │  • Add Memories      │              │  • /connect CODE     │            │
│  │  • Search            │              │  • /list             │            │
│  │  • Knowledge Graph   │              │  • /search query     │            │
│  │  • View Integrations │              │  • Send text/photos  │            │
│  └──────────┬───────────┘              └──────────┬───────────┘            │
│             │                                     │                         │
└─────────────┼─────────────────────────────────────┼─────────────────────────┘
              │                                     │
              │                                     │
              ▼                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────┐    ┌────────────────────────────┐   │
│  │   Next.js Frontend               │    │   Telegram Bot API         │   │
│  │   (React 18 + TypeScript)        │    │   (Official Telegram)      │   │
│  │                                  │    │                            │   │
│  │  • Pages (App Router)            │    │  • Webhook delivery        │   │
│  │  • Components (shadcn/ui)        │    │  • Message routing         │   │
│  │  • API Routes                    │    │  • File handling           │   │
│  │  • State Management              │    │                            │   │
│  └──────────┬───────────────────────┘    └─────────┬──────────────────┘   │
│             │                                       │                       │
│             │ HTTP/JSON                             │ HTTPS/Webhook         │
│             ▼                                       ▼                       │
│  ┌──────────────────────────────────┐    ┌────────────────────────────┐   │
│  │   Next.js API Routes             │    │   Python FastAPI Backend   │   │
│  │   /api/telegram/*                │    │   (Async/Uvicorn)          │   │
│  │                                  │    │                            │   │
│  │  • generate-code                 │◄───┤  • Webhook handler         │   │
│  │  • status                        │    │  • Command processors      │   │
│  │  • disconnect                    │    │  • Message handlers        │   │
│  │                                  │    │  • Health checks           │   │
│  └──────────┬───────────────────────┘    └─────────┬──────────────────┘   │
│             │                                       │                       │
│             │ Internal API (API Key)                │                       │
│             └───────────────┬───────────────────────┘                       │
│                             │                                               │
└─────────────────────────────┼───────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BUSINESS LOGIC                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      Python Services Layer                           │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │                                                                       │  │
│  │  ┌───────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │  │
│  │  │ Telegram Bot  │  │ Auth Service │  │  Embedding Service       │ │  │
│  │  │  Service      │  │              │  │                          │ │  │
│  │  │               │  │  • Generate  │  │  • GitHub Models API     │ │  │
│  │  │  • Commands   │  │    codes     │  │  • text-embedding-3-small│ │  │
│  │  │  • Handlers   │  │  • Verify    │  │  • Batch processing      │ │  │
│  │  │  • State mgmt │  │  • Connect   │  │  • Error handling        │ │  │
│  │  └───────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘ │  │
│  │          │                  │                     │                  │  │
│  │          └──────────────────┼─────────────────────┘                  │  │
│  │                             │                                        │  │
│  │  ┌──────────────────────────▼─────────────────────────────────────┐ │  │
│  │  │              Memory Service                                     │ │  │
│  │  │                                                                 │ │  │
│  │  │  • Create memories                                              │ │  │
│  │  │  • Search (semantic + text)                                     │ │  │
│  │  │  • List recent                                                  │ │  │
│  │  │  • Get statistics                                               │ │  │
│  │  │  • File handling                                                │ │  │
│  │  └─────────────────────────┬───────────────────────────────────────┘ │  │
│  │                            │                                         │  │
│  └────────────────────────────┼─────────────────────────────────────────┘  │
│                               │                                             │
└───────────────────────────────┼─────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │              Supabase (PostgreSQL + pgvector)                        │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │                                                                       │  │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │  │
│  │  │   memories      │  │ telegram_auth    │  │  telegram_       │  │  │
│  │  │                 │  │     _codes       │  │   connections    │  │  │
│  │  │  • id           │  │                  │  │                  │  │  │
│  │  │  • user_id      │  │  • code          │  │  • user_id       │  │  │
│  │  │  • title        │  │  • user_id       │  │  • telegram_id   │  │  │
│  │  │  • content      │  │  • expires_at    │  │  • username      │  │  │
│  │  │  • embedding    │  │  • is_used       │  │  • is_active     │  │  │
│  │  │  • source       │  │                  │  │  • connected_at  │  │  │
│  │  │  • created_at   │  │                  │  │                  │  │  │
│  │  └─────────────────┘  └──────────────────┘  └──────────────────┘  │  │
│  │                                                                       │  │
│  │  Features:                                                            │  │
│  │  • Row Level Security (RLS)                                           │  │
│  │  • Vector similarity search (pgvector)                                │  │
│  │  • Connection pooling                                                 │  │
│  │  • Indexes on frequently queried columns                              │  │
│  │  • Automatic cleanup of expired codes                                 │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────┐              ┌────────────────────┐                │
│  │  GitHub Models API │              │  Supabase Auth     │                │
│  │                    │              │                    │                │
│  │  • Embeddings      │              │  • User accounts   │                │
│  │  • GPT models      │              │  • Sessions        │                │
│  │  • Rate limiting   │              │  • JWT tokens      │                │
│  └────────────────────┘              └────────────────────┘                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                              DATA FLOW EXAMPLES
═══════════════════════════════════════════════════════════════════════════════

Example 1: User Connects Telegram Account
───────────────────────────────────────────

1. User clicks "Generate Code" in web app
2. Next.js → API Route → Python Backend → Generate 6-digit code
3. Code saved to database with 10min expiry
4. Code displayed in UI with countdown
5. User opens Telegram bot, sends: /connect ABC123
6. Telegram → Bot API → Python Backend → Verify code
7. If valid: Create connection record in DB
8. Send confirmation to user on both Telegram and web

Example 2: User Adds Memory via Telegram
──────────────────────────────────────────

1. User sends text message to Telegram bot
2. Telegram → Bot API → Python Backend webhook
3. Check if user connected (query telegram_connections)
4. Generate embedding via GitHub Models API
5. Save memory to database with embedding
6. Send confirmation to user
7. Memory immediately available in web app

Example 3: User Searches Memories
───────────────────────────────────

1. User sends: /search birthday party
2. Telegram → Bot API → Python Backend
3. Generate embedding for "birthday party"
4. Query database using vector similarity
5. Return top 5 matching memories
6. Format and send results to user

═══════════════════════════════════════════════════════════════════════════════
                            SECURITY LAYERS
═══════════════════════════════════════════════════════════════════════════════

Layer 1: Network
  • HTTPS everywhere
  • Webhook secret validation
  • API key for backend calls

Layer 2: Authentication
  • Supabase Auth for web users
  • 6-digit codes for Telegram (10min expiry, one-time use)
  • JWT tokens for API requests

Layer 3: Authorization
  • Row Level Security (RLS) in database
  • User can only access own memories
  • User can only connect one Telegram account

Layer 4: Data
  • Parameterized SQL queries (no injection)
  • Input validation (Pydantic models)
  • Environment variables for secrets

═══════════════════════════════════════════════════════════════════════════════
                          PERFORMANCE FEATURES
═══════════════════════════════════════════════════════════════════════════════

• Async/await throughout Python backend
• Database connection pooling (2-10 connections)
• Vector indexes for fast similarity search
• Batch embedding generation
• Webhook-based bot (not polling)
• CDN for static assets (Next.js)
• Optimistic UI updates

═══════════════════════════════════════════════════════════════════════════════
                              MONITORING
═══════════════════════════════════════════════════════════════════════════════

Health Checks:
  • GET /health - Basic status
  • GET /health/detailed - Service status (DB, Bot, etc.)

Logging:
  • Structured logging with loguru
  • Log levels: DEBUG, INFO, WARNING, ERROR
  • Request/response logging
  • Error stack traces

Metrics to Monitor:
  • Code generation rate
  • Connection success rate
  • Memory creation rate
  • Embedding generation time
  • Search query performance
  • Webhook response time
```
