import { useState, useEffect, useRef, useCallback } from 'react';

export function useAction<T>(
  fn: () => Promise<{ ok: boolean; error: string | null } & T>
): {
  run: () => Promise<void>;
  loading: boolean;
  error: string | null;
  reset: () => void;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    if (loading) return;
    if (mounted.current) {
      setLoading(true);
      setError(null);
    }
    try {
      const result = await fn();
      if (!result.ok) {
        if (mounted.current) setError(result.error);
      }
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [fn, loading]);

  const reset = useCallback(() => {
    if (mounted.current) {
      setLoading(false);
      setError(null);
    }
  }, []);

  return { run, loading, error, reset };
}
