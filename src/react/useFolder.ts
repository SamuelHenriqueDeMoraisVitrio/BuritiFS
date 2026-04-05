import { useState, useEffect } from 'react';
import ExplorerFolder from '../core/Explorer/folder';
import type { ListItem } from '../core/types/general';

export function useFolder(
  folder: ExplorerFolder,
  options?: { recursive?: boolean; filter?: (item: ListItem) => boolean }
): { items: ListItem[]; loading: boolean; error: string | null } {
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const result = await folder.list(options ?? {});
      if (cancelled) return;
      if (result.ok) {
        setItems(result.items);
        setError(null);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }

    load();

    const unsubscribe = folder.tree.subscribe(folder.path, () => {
      load();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [folder, options?.recursive, options?.filter]);

  return { items, loading, error };
}
