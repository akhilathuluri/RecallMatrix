-- Add vector search function for RAG-based memory retrieval
--
-- This function performs semantic search using cosine similarity
-- between the query embedding and stored memory embeddings

CREATE OR REPLACE FUNCTION search_memories(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  user_id_param uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  content text,
  type text,
  index_position integer,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.user_id,
    m.title,
    m.content,
    m.type,
    m.index_position,
    m.created_at,
    1 - (m.embedding <=> query_embedding) as similarity
  FROM memories m
  WHERE m.user_id = user_id_param
    AND m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
