# User Profile Context Feature

## Overview

This feature allows users to provide information about themselves through a profile bio field. The system generates AI embeddings from this information, enabling the AI to understand and answer questions about the user.

## Architecture

### Modular Components

1. **Database Layer** (`supabase/migrations/20251125000000_add_user_profile_context.sql`)
   - Adds `bio` and `bio_embedding` fields to profiles table
   - Creates vector index for semantic search on profile embeddings
   - Maintains existing database structure without breaking changes

2. **Component Layer** (`components/UserProfileSection.tsx`)
   - Standalone, reusable component for user profile management
   - Uses existing `/api/embeddings` endpoint for embedding generation
   - Handles bio input and embedding generation
   - Shows real-time character count and save status
   - Provides helpful tips for users

3. **API Layer** (`app/api/profile-context/route.ts`)
   - RESTful endpoint to retrieve user context
   - Returns structured profile data for AI consumption
   - Secure and user-scoped

## Features

### For Users
- **Profile Bio**: Users can describe themselves in up to 2000 characters
- **Real-time Updates**: Changes are tracked and can be saved anytime
- **AI Context**: Profile information helps AI answer questions about the user
- **Privacy**: Profile information is private and only visible to the user
- **Helpful Guidance**: Tips and examples help users write effective profiles

### For Developers
- **Modular Design**: Each component is independent and can be modified separately
- **Type Safety**: Full TypeScript support with proper types
- **Error Handling**: Comprehensive error handling at all layers
- **Extensible**: Easy to add more profile fields or change embedding providers
- **Well Documented**: Comments and documentation throughout

## Usage

### User Flow
1. Navigate to Settings page
2. Find "About You" section at the top
3. Enter information about yourself
4. Click "Save Profile Context"
5. System generates embeddings automatically
6. AI can now answer questions about you

### For AI Integration
When implementing AI chat or Q&A features, fetch user context:

```typescript
const response = await fetch('/api/profile-context', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: user.id }),
});

const { context } = await response.json();

// Use context.bio as system context for AI
const systemPrompt = `User Information: ${context.bio}`;
```

## Database Schema

```sql
-- New fields added to profiles table
bio text DEFAULT ''
bio_embedding vector(1536)

-- Index for semantic search
idx_profiles_bio_embedding (using ivfflat with vector_cosine_ops)
```

## API Endpoints

### POST `/api/profile-context`
Retrieves user profile context for AI.

**Request:**
```json
{
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "context": {
    "name": "John Doe",
    "email": "john@example.com",
    "bio": "User's profile bio text...",
    "hasContext": true
  }
}
```

## Future Enhancements

### Planned Features
1. **Semantic Profile Search**: Find users with similar profiles
2. **Profile Suggestions**: AI-powered suggestions for improving profiles
3. **Multi-language Support**: Embeddings for multiple languages
4. **Profile History**: Track changes to profile over time
5. **Rich Profile Fields**: Add structured fields (skills, interests, goals)

### Extension Points
- Existing `/api/embeddings` endpoint: Already handles all embedding needs
- `components/UserProfileSection.tsx`: Add new profile fields
- `app/api/profile-context/route.ts`: Extend context structure
- Migration files: Add new profile-related tables

## Security Considerations

1. **Row Level Security**: Profile data protected by RLS policies
2. **User Scoping**: Users can only access their own profiles
3. **API Validation**: All inputs validated and sanitized
4. **Token Security**: GitHub API token stored securely in env vars
5. **Privacy**: Bio embeddings stored securely, not exposed to clients

## Testing

### Manual Testing
1. Create a new user account
2. Navigate to Settings
3. Enter bio text
4. Save and verify success toast
5. Refresh page and verify bio persists
6. Update bio and verify new embedding generated
7. Test API endpoint with user ID

### Integration Points to Test
- Profile creation on signup
- Profile updates trigger embedding regeneration
- API returns correct user context
- Embeddings are properly indexed
- Character limit enforcement (2000 chars)

## Troubleshooting

### Common Issues

**Embedding generation fails**
- Check GitHub API token is set in environment variables
- Verify token has correct permissions
- Check API rate limits

**Profile not saving**
- Verify Supabase connection
- Check RLS policies allow user updates
- Review browser console for errors

**API returns empty context**
- Ensure user has saved a bio
- Verify userId is correct
- Check database migration ran successfully

## Maintenance

### Regular Tasks
- Monitor embedding generation success rates
- Review API usage and costs
- Update embedding model when new versions available
- Optimize vector index performance as user base grows

### Updating the Feature
1. **Database Changes**: Create new migration files
2. **UI Changes**: Update `components/UserProfileSection.tsx`
3. **API Changes**: Update `app/api/profile-context/route.ts`
4. **Types**: Update types in `lib/supabase/client.ts`
5. **Embeddings**: Use existing `/api/embeddings` endpoint

## Dependencies

- `@supabase/supabase-js`: Database client
- GitHub Models API: Embedding generation
- Next.js: API routes and server components
- shadcn/ui: UI components
- Sonner: Toast notifications

## License & Credits

Part of MemoryVault application. Follows existing project structure and conventions.
