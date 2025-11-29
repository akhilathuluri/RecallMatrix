-- Fix Telegram Activity Trigger
-- Migration: 20251126000001_fix_telegram_activity_trigger.sql
-- This migration fixes the trigger that updates last_activity_at in telegram_connections

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_update_telegram_activity ON memories;
DROP FUNCTION IF EXISTS update_telegram_activity();

-- Create corrected function: Update last activity timestamp
-- The function should use the user_id from the memory to find the telegram connection
CREATE OR REPLACE FUNCTION update_telegram_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE telegram_connections
    SET last_activity_at = NOW()
    WHERE user_id = NEW.user_id
    AND is_active = true;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger: Update activity on memory creation from Telegram
CREATE TRIGGER trigger_update_telegram_activity
    AFTER INSERT ON memories
    FOR EACH ROW
    WHEN (NEW.source = 'telegram')
    EXECUTE FUNCTION update_telegram_activity();

COMMENT ON FUNCTION update_telegram_activity() IS 'Updates the last_activity_at timestamp for telegram connections when memories are created via Telegram';
