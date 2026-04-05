import { useState, useEffect } from 'react';
import ExplorerTree from '../core/Explorer/ExplorerMain';
import ExplorerFolder from '../core/Explorer/folder';

type UseExplorerState = 
  | { loading: true; error: null; tree: null; root: null }
  | { loading: false; error: string; tree: null; root: null }
  | { loading: false; error: null; tree: ExplorerTree; root: ExplorerFolder };

export function useExplorer(name: string) {
  const [state, setState] = useState<UseExplorerState>({
    loading: true,
    error: null,
    tree: null,
    root: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const result = await ExplorerTree.create({ name });

      if (cancelled) {
        if (result instanceof ExplorerTree) ExplorerTree.close({ name });
        return;
      }

      if (!(result instanceof ExplorerTree)) {
        setState({ loading: false, error: result.error, tree: null, root: null });
        return;
      }

      const rootResult = await result.source({ path: '/' });

      if (cancelled) {
        ExplorerTree.close({ name });
        return;
      }

      if (!(rootResult instanceof ExplorerFolder)) {
        setState({ loading: false, error: rootResult.error, tree: null, root: null });
        return;
      }

      setState({ loading: false, error: null, tree: result, root: rootResult });
    }

    init();

    return () => {
      cancelled = true;
      ExplorerTree.close({ name });
    };
  }, [name]);

  return state;
}
