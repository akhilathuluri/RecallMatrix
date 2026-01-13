import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { InsightsData } from '@/components/InsightsModal';

export function useInsights() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const result = await response.json();
      setData(result.data);
      
      return result.data;
    } catch (error: any) {
      console.error('Error fetching insights:', error);
      toast.error('Failed to generate insights');
      setData(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearInsights = useCallback(() => {
    setData(null);
  }, []);

  return {
    data,
    loading,
    fetchInsights,
    clearInsights,
  };
}
