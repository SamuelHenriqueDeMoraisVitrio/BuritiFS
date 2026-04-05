import { useState, useEffect } from 'react';
import ExplorerTree from '../core/Explorer/ExplorerMain';
import ExplorerFolder from '../core/Explorer/folder';

type UseExplorerState =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; root: ExplorerFolder };

export function useExplorer(name: string): UseExplorerState {
  const [state, setState] = useState<UseExplorerState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function open() {
      const result = await ExplorerTree.create({ name });

      if (cancelled) {
        if (result instanceof ExplorerTree) ExplorerTree.close({ name });
        return;
      }

      if (!(result instanceof ExplorerTree)) {
        setState({ status: 'error', error: result.error });
        return;
      }

      const rootResult = await result.source({ path: '/' });

      if (cancelled) {
        ExplorerTree.close({ name });
        return;
      }

      if (!(rootResult instanceof ExplorerFolder)) {
        setState({ status: 'error', error: rootResult.error });
        return;
      }

      setState({ status: 'ready', root: rootResult });
    }

    open();

    return () => {
      cancelled = true;
      ExplorerTree.close({ name });
    };
  }, [name]);

  return state;
}
