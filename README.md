# RecallMatrix

An AI-powered memory management web application with intelligent RAG (Retrieval-Augmented Generation) search capabilities. Built for people who need help remembering important information, MemoryVault uses advanced embedding technology to help you find memories through natural language queries.

## 🎉 New: Telegram Bot Integration!

**Manage your memories directly from Telegram!** 

✨ Add memories, search, and view your collection via our Telegram bot. See [TELEGRAM_INTEGRATION.md](TELEGRAM_INTEGRATION.md) for setup instructions.

## Features

- **Smart Memory Storage**: Save text memories and file attachments (images/videos)
- **RAG-Powered Search**: Search your memories using natural language queries
- **AI Embeddings**: Automatic indexing using GitHub Models API (text-embedding-3-small)
- **Intelligent Retrieval**: Vector similarity search for semantic memory matching
- **Knowledge Graph**: Visual representation of memory connections with clustering
- **Telegram Bot**: Manage memories from Telegram (see TELEGRAM_INTEGRATION.md)
- **User Authentication**: Secure email/password authentication via Supabase
- **Theme Support**: Light and dark mode with system preference detection
- **Storage Management**: Track storage usage with 100MB total limit
- **Responsive Design**: Optimized for all devices and screen sizes
- **Modern UI**: Beautiful, minimalistic interface with smooth animations

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Visualization**: Canvas-based Knowledge Graph with force-directed layout

### Backend
- **Database**: Supabase (PostgreSQL with pgvector)
- **Authentication**: Supabase Auth
- **AI/ML**: GitHub Models API (text-embedding-3-small, gpt-4o-mini)
- **Storage**: Supabase Storage
- **Telegram Bot**: Python FastAPI backend (see `/backend`)

### Integrations
- **Telegram Bot**: Full-featured bot for memory management
- **More coming soon**: Google Drive, Notion, Evernote, Apple Photos

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- GitHub Models API access

### 2. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. The database migrations have already been applied via the MCP tools
3. Enable the `vector` extension in your database if not already enabled
4. Note your project URL and anon key from Settings > API

### 3. GitHub Models API Setup

1. Get access to GitHub Models at https://github.com/marketplace/models
2. Generate an API key for accessing the models
3. This app uses:
   - `text-embedding-3-large` for generating embeddings
   - `gpt-4o` for text generation (future features)

### 4. Environment Variables

Update the `.env.local` file with your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GITHUB_MODELS_API_KEY=your_github_models_api_key
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Build for Production

```bash
npm run build
npm run start
```

## Usage

### Creating Memories

1. Click "Add Memory" in the navigation bar
2. Choose between "Text Memory" or "File Memory"
3. For text memories: Enter a title and detailed content
4. For file memories: Enter a title and upload images/videos (max 10MB per file)
5. Memories are automatically indexed with AI embeddings

### Searching Memories

1. Use the search bar on the home page
2. Enter natural language queries like:
   - "Where did I keep my passport?"
   - "Photos from last vacation"
   - "Notes about the book I wanted to read"
3. The RAG system will find semantically similar memories

### Managing Your Account

- **Settings**: Update your profile and monitor storage usage
- **Theme**: Toggle between light/dark mode via the profile menu
- **Integrations**: Coming soon - sync with Google Drive, Notion, etc.

## File Storage Limits

- Maximum file size: 10MB per file
- Total storage limit: 100MB per account
- Supported formats: Images and videos only

## Database Schema

### profiles
- User account information and storage tracking

### memories
- Text and file memories with vector embeddings
- Indexed for efficient retrieval

### memory_files
- File attachments linked to memories

### Storage
- Supabase Storage bucket for file uploads

## Architecture

### RAG Search Flow

1. User enters a search query
2. Query is converted to embeddings using OpenAI's text-embedding-3-large
3. Vector similarity search finds relevant memories
4. Results are ranked by cosine similarity
5. Top matches are displayed to the user

### Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- File storage paths include user ID for isolation
- API keys are stored securely on the server side

## Future Enhancements

- Third-party integrations (Google Drive, Notion, Evernote)
- Advanced memory organization with tags and categories
- Memory sharing and collaboration
- Export functionality
- Mobile applications
- Voice memo support
- OCR for text extraction from images

## License

This project is private and proprietary.

## Support

For issues or questions, please contact the development team.
