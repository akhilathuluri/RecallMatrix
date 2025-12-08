-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session metadata
  title TEXT NOT NULL DEFAULT 'New Chat',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- Context and memory references
  memory_ids UUID[] DEFAULT ARRAY[]::UUID[],
  context_used TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Additional metadata (tokens, model, etc.)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for fast queries
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- RLS Policies for chat_sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat sessions"
  ON chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON chat_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions"
  ON chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat messages"
  ON chat_messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages"
  ON chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions
  SET updated_at = NOW()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update session timestamp when message is added
CREATE TRIGGER update_chat_session_timestamp
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_session_updated_at();

-- Comments
COMMENT ON TABLE chat_sessions IS 'Stores chat conversation sessions';
COMMENT ON TABLE chat_messages IS 'Stores individual messages within chat sessions';
