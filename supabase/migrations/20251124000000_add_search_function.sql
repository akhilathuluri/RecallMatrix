-- Add vector search function for memories
-- This function performs semantic search using cosine similarity

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS search_memories(vector, double precision, integer, uuid);

CREATE OR REPLACE FUNCTION search_memories(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  user_id_param uuid
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  content text,
  type text,
  embedding vector(1536),
  index_position integer,
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.user_id,
    m.title,
    m.content,
    m.type,
    m.embedding,
    m.index_position,
    m.created_at,
    m.updated_at,
    1 - (m.embedding <=> query_embedding) as similarity
  FROM memories m
  WHERE m.user_id = user_id_param
    AND m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
