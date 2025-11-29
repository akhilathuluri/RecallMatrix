-- Add Organization Fields to Memories
-- Adds category and tags columns to support AI agent organization

-- Add category column
ALTER TABLE memories
ADD COLUMN IF NOT EXISTS category text DEFAULT 'Personal';

-- Add tags column (array of text)
ALTER TABLE memories
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Add cluster_id for grouping related memories
ALTER TABLE memories
ADD COLUMN IF NOT EXISTS cluster_id text;

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(user_id, category);

-- Create index for tag searching
CREATE INDEX IF NOT EXISTS idx_memories_tags ON memories USING GIN (tags);

-- Add comment
COMMENT ON COLUMN memories.category IS 'AI-assigned category (Work, Personal, Finance, etc.)';
COMMENT ON COLUMN memories.tags IS 'AI-generated tags for easy filtering';
COMMENT ON COLUMN memories.cluster_id IS 'Cluster ID for grouping related memories';
