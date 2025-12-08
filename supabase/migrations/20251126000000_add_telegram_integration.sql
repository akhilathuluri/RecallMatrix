-- Telegram Integration Tables
-- Migration: 20251126000000_add_telegram_integration.sql

-- Table: telegram_auth_codes
-- Stores temporary authentication codes for connecting Telegram accounts
CREATE TABLE IF NOT EXISTS telegram_auth_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT telegram_auth_codes_code_key UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS idx_telegram_auth_codes_user_id ON telegram_auth_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_auth_codes_code ON telegram_auth_codes(code) WHERE NOT is_used;
CREATE INDEX IF NOT EXISTS idx_telegram_auth_codes_expires_at ON telegram_auth_codes(expires_at);

-- Table: telegram_connections
-- Stores active Telegram account connections
CREATE TABLE IF NOT EXISTS telegram_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    telegram_user_id VARCHAR(50) NOT NULL UNIQUE,
    telegram_username VARCHAR(100),
    telegram_first_name VARCHAR(100),
    telegram_last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT telegram_connections_telegram_user_id_key UNIQUE (telegram_user_id)
);

CREATE INDEX IF NOT EXISTS idx_telegram_connections_user_id ON telegram_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_connections_telegram_user_id ON telegram_connections(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_connections_active ON telegram_connections(user_id, is_active);

-- Add source column to memories table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'memories' AND column_name = 'source'
    ) THEN
        ALTER TABLE memories ADD COLUMN source VARCHAR(50) DEFAULT 'web';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_memories_source ON memories(source);

-- Row Level Security (RLS) Policies

-- telegram_auth_codes: Users can only see their own codes
ALTER TABLE telegram_auth_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own auth codes"
    ON telegram_auth_codes
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own auth codes"
    ON telegram_auth_codes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own auth codes"
    ON telegram_auth_codes
    FOR UPDATE
    USING (auth.uid() = user_id);

-- telegram_connections: Users can only see their own connections
ALTER TABLE telegram_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections"
    ON telegram_connections
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections"
    ON telegram_connections
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections"
    ON telegram_connections
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections"
    ON telegram_connections
    FOR DELETE
    USING (auth.uid() = user_id);

-- Function: Clean up expired auth codes (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_auth_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM telegram_auth_codes
    WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update last activity timestamp
CREATE OR REPLACE FUNCTION update_telegram_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE telegram_connections
    SET last_activity_at = NOW()
    WHERE telegram_user_id = NEW.telegram_user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update activity on memory creation from Telegram
CREATE TRIGGER trigger_update_telegram_activity
    AFTER INSERT ON memories
    FOR EACH ROW
    WHEN (NEW.source = 'telegram')
    EXECUTE FUNCTION update_telegram_activity();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON telegram_auth_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON telegram_connections TO authenticated;

-- Comments for documentation
COMMENT ON TABLE telegram_auth_codes IS 'Temporary authentication codes for linking Telegram accounts';
COMMENT ON TABLE telegram_connections IS 'Active Telegram account connections to MemoryVault users';
COMMENT ON COLUMN memories.source IS 'Source of memory creation: web, telegram, api, etc.';
