import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a singleton browser client
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

const getSupabaseClient = () => {
  if (typeof window === 'undefined') {
    // For SSR, return a placeholder (won't be used in practice)
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }

  if (!supabaseInstance && supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
  }

  if (!supabaseInstance) {
    // Fallback with proper configuration
    supabaseInstance = createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }

  return supabaseInstance;
};

export const supabase = getSupabaseClient();

export type Memory = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: 'text' | 'file';
  embedding: number[] | null;
  index_position: number;
  category?: string;
  tags?: string[];
  cluster_id?: string;
  created_at: string;
  updated_at: string;
};

export type MemoryFile = {
  id: string;
  memory_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  bio: string;
  bio_embedding: number[] | null;
  storage_used: number;
  created_at: string;
  updated_at: string;
};
