"""
Apply the storage bucket migration
"""
import asyncio
import asyncpg  # type: ignore
from dotenv import load_dotenv  # type: ignore
import os

load_dotenv()

async def create_bucket():
    DATABASE_URL = os.getenv("DATABASE_URL")
    
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        print("Creating telegram-files storage bucket...")
        
        # Create bucket
        await conn.execute("""
            INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
            VALUES (
              'telegram-files',
              'telegram-files',
              true,
              52428800,
              ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4', 'video/quicktime']
            )
            ON CONFLICT (id) DO NOTHING
        """)
        
        print("Creating storage policies...")
        
        # Drop existing policies if they exist
        await conn.execute("DROP POLICY IF EXISTS \"Authenticated users can upload telegram files\" ON storage.objects")
        await conn.execute("DROP POLICY IF EXISTS \"Public can view telegram files\" ON storage.objects")
        await conn.execute("DROP POLICY IF EXISTS \"Users can update own telegram files\" ON storage.objects")
        await conn.execute("DROP POLICY IF EXISTS \"Users can delete own telegram files\" ON storage.objects")
        
        # Create policies
        await conn.execute("""
            CREATE POLICY "Authenticated users can upload telegram files"
            ON storage.objects FOR INSERT
            TO authenticated
            WITH CHECK (bucket_id = 'telegram-files' AND auth.uid()::text = (storage.foldername(name))[1])
        """)
        
        await conn.execute("""
            CREATE POLICY "Public can view telegram files"
            ON storage.objects FOR SELECT
            TO public
            USING (bucket_id = 'telegram-files')
        """)
        
        await conn.execute("""
            CREATE POLICY "Users can update own telegram files"
            ON storage.objects FOR UPDATE
            TO authenticated
            USING (bucket_id = 'telegram-files' AND auth.uid()::text = (storage.foldername(name))[1])
        """)
        
        await conn.execute("""
            CREATE POLICY "Users can delete own telegram files"
            ON storage.objects FOR DELETE
            TO authenticated
            USING (bucket_id = 'telegram-files' AND auth.uid()::text = (storage.foldername(name))[1])
        """)
        
        print("✓ Storage bucket and policies created successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(create_bucket())
