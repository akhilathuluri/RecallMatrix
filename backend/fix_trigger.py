"""
Quick script to fix the telegram activity trigger
"""
import asyncio
import asyncpg
from dotenv import load_dotenv
import os

load_dotenv()

async def fix_trigger():
    DATABASE_URL = os.getenv("DATABASE_URL")
    
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        print("Dropping old trigger and function...")
        await conn.execute("DROP TRIGGER IF EXISTS trigger_update_telegram_activity ON memories")
        await conn.execute("DROP FUNCTION IF EXISTS update_telegram_activity()")
        
        print("Creating fixed function...")
        await conn.execute("""
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
        """)
        
        print("Creating fixed trigger...")
        await conn.execute("""
            CREATE TRIGGER trigger_update_telegram_activity
                AFTER INSERT ON memories
                FOR EACH ROW
                WHEN (NEW.source = 'telegram')
                EXECUTE FUNCTION update_telegram_activity();
        """)
        
        print("✓ Trigger fixed successfully!")
        
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(fix_trigger())
