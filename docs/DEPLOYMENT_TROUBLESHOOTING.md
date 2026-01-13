# Deployment Troubleshooting Guide

## Issue: Chat Not Finding Memories in Production

### Symptoms
- **Localhost**: Chat correctly retrieves memories (e.g., "Your favorite food is briyani! - 2 sources")
- **Production**: Chat says "I don't have any memories about your favorite food"

### Root Causes & Solutions

## 1. Database Migrations Not Applied

The `search_memories` function might not exist in production database.

### Solution: Run Supabase Migrations

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your production project
supabase link --project-ref YOUR_PROJECT_REF

# Push all migrations to production
supabase db push

# Or apply migrations manually via Supabase Dashboard
# Dashboard → SQL Editor → Run each migration file
```

### Required Migrations:
1. `20251123135033_create_memory_app_schema.sql` - Creates tables
2. `20251123135127_add_vector_search_function.sql` - Creates search function
3. `20251124000000_add_search_function.sql` - Updates search function
4. All subsequent migrations

### Verify Function Exists:
```sql
-- Run in Supabase SQL Editor
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'search_memories';
```

## 2. Missing Environment Variables

Production might be missing critical environment variables.

### Required Environment Variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# GitHub Models API (for AI responses)
GITHUB_MODELS_API_KEY=github_pat_xxxxx
# Or fallback to:
GITHUB_TOKEN=github_pat_xxxxx

# Optional: Node environment
NODE_ENV=production
```

### How to Set in Vercel:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable for **Production** environment
3. Redeploy the application

### How to Set in Other Platforms:
- **Netlify**: Site settings → Environment variables
- **Railway**: Variables tab
- **AWS Amplify**: Environment variables section

## 3. Data Not Synced to Production

Your test memories might only exist in local Supabase.

### Check Data in Production:

```sql
-- Run in Production Supabase Dashboard → SQL Editor
SELECT COUNT(*) as memory_count FROM memories;

SELECT id, title, 
       CASE WHEN embedding IS NULL THEN 'Missing' ELSE 'Present' END as embedding_status
FROM memories 
LIMIT 10;
```

### Solutions:

**Option A: Manual Data Entry**
- Log into production app and manually create memories

**Option B: Export/Import Data**
```bash
# Export from local Supabase
supabase db dump --file local_backup.sql --local

# Import to production (be careful!)
psql "your_production_connection_string" < local_backup.sql
```

**Option C: Use Supabase Studio**
1. Local Supabase Studio → Table Editor → Select rows
2. Copy data
3. Production Supabase Studio → Table Editor → Insert rows

## 4. pgvector Extension Not Enabled

The vector search requires pgvector extension.

### Verify Extension:
```sql
-- Run in Production Supabase SQL Editor
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### Enable if Missing:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Or enable via Supabase Dashboard:
- Database → Extensions → Search for "vector" → Enable

## 5. Row Level Security (RLS) Issues

RLS policies might be blocking queries in production.

### Check RLS Policies:
```sql
-- View policies for memories table
SELECT * FROM pg_policies WHERE tablename = 'memories';
```

### Verify API is Using Service Role Key:
In `app/api/search/route.ts`, check:
```typescript
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
```

The service role key bypasses RLS, so it must be set correctly.

## 6. Embedding Generation Issues

Embeddings might not be generated for memories in production.

### Check Embedding Status:
```sql
SELECT 
  COUNT(*) FILTER (WHERE embedding IS NULL) as missing_embeddings,
  COUNT(*) FILTER (WHERE embedding IS NOT NULL) as has_embeddings
FROM memories;
```

### Regenerate Embeddings:
If embeddings are missing, you need to trigger embedding generation:

```typescript
// Create a script or API endpoint to regenerate
const { data: memories } = await supabase
  .from('memories')
  .select('*')
  .is('embedding', null);

for (const memory of memories) {
  const embedding = await generateEmbedding(`${memory.title} ${memory.content}`);
  await supabase
    .from('memories')
    .update({ embedding })
    .eq('id', memory.id);
}
```

## Quick Diagnostic Checklist

Run these checks in order:

- [ ] **Environment variables are set in production**
  ```bash
  # Check in Vercel/Netlify/etc dashboard
  echo $SUPABASE_SERVICE_ROLE_KEY
  echo $GITHUB_MODELS_API_KEY
  ```

- [ ] **Database migrations applied**
  ```sql
  SELECT routine_name FROM information_schema.routines 
  WHERE routine_name = 'search_memories';
  ```

- [ ] **pgvector extension enabled**
  ```sql
  SELECT * FROM pg_extension WHERE extname = 'vector';
  ```

- [ ] **Memories exist in production database**
  ```sql
  SELECT COUNT(*) FROM memories;
  ```

- [ ] **Embeddings are generated**
  ```sql
  SELECT COUNT(*) FROM memories WHERE embedding IS NOT NULL;
  ```

- [ ] **User IDs match between local and production**
  ```sql
  SELECT id, email FROM auth.users LIMIT 5;
  ```

## Testing After Fixes

1. **Create a test memory in production**:
   - Login to production app
   - Add a memory with clear content: "My favorite food is pizza"

2. **Test search API directly**:
   ```bash
   curl -X POST https://your-app.vercel.app/api/search \
     -H "Content-Type: application/json" \
     -d '{"query": "favorite food", "userId": "YOUR_USER_ID"}'
   ```

3. **Test chat**:
   - Go to chat page
   - Ask: "What is my favorite food?"
   - Should return: "Your favorite food is pizza!"

## Common Production Platforms

### Vercel
- Migrations: Run manually via Supabase Dashboard
- Env vars: Settings → Environment Variables
- Logs: Deployments → View Function Logs

### Netlify
- Migrations: Run manually via Supabase Dashboard  
- Env vars: Site settings → Environment variables
- Logs: Functions tab → Function log

### Railway
- Migrations: Run via Supabase CLI
- Env vars: Variables tab
- Logs: Deployments → Logs

## Still Not Working?

### Enable Debug Logging:

Add this to your production environment variables:
```env
NODE_ENV=development
```

This will enable console.log statements in the search API to help diagnose issues.

### Check Production Logs:

Look for errors related to:
- "Failed to generate query embedding"
- "Search error"
- "GITHUB_MODELS_API_KEY not configured"
- Database connection errors

### Contact Support:

If issues persist, check:
1. Supabase project status (dashboard.supabase.com)
2. GitHub Models API rate limits
3. Deployment platform status pages
