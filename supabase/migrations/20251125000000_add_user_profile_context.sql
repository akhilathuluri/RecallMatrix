-- Add user profile context fields
-- This allows users to provide information about themselves for better AI context

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio text DEFAULT '',
ADD COLUMN IF NOT EXISTS bio_embedding vector(1536);

-- Create index for bio embedding similarity search
CREATE INDEX IF NOT EXISTS idx_profiles_bio_embedding ON profiles 
USING ivfflat (bio_embedding vector_cosine_ops)
WITH (lists = 100);

-- Add comment for documentation
COMMENT ON COLUMN profiles.bio IS 'User biography/context for AI understanding';
COMMENT ON COLUMN profiles.bio_embedding IS 'Vector embedding of user bio for semantic search';
