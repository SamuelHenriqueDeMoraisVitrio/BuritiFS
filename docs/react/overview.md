# React Integration Overview

BuritiFS ships three React hooks that together cover the full lifecycle of working with a browser filesystem: opening it, observing its contents reactively, and performing mutations with tracked state.

---

## The Three Hooks

| Hook | Purpose |
|---|---|
| `useExplorer(name)` | Opens a named filesystem. Handles initialization, loading state, and cleanup on unmount. |
| `useFolder(folder, options?)` | Observes the contents of a folder. Re-renders automatically when the folder changes. |
| `useAction(fn)` | Wraps any filesystem mutation with `loading` and `error` state. |

### When to use each

- Use **`useExplorer`** once, near the root of your app. Pass `root` down to child components via props or context.
- Use **`useFolder`** in any component that displays directory contents. It subscribes internally and re-renders on changes.
- Use **`useAction`** in any component that triggers a mutation: creating files, deleting, renaming, moving. One `useAction` per operation.

---

## Requirements

- React 18 or later.
- `react` is a peer dependency — BuritiFS does not bundle React.
- Import from `buritifs/react` (the `/react` subpath), not from `buritifs`.

```typescript
import { useExplorer, useFolder, useAction } from 'buritifs/react';
```

---

## How the Hooks Relate to Each Other

```
┌────────────────────────────────────────────────────────────────┐
│  useExplorer('my-app')                                          │
│                                                                  │
│  status: 'loading' → 'ready'                                    │
│  root: ExplorerFolder  ──────────────────────┐                  │
└──────────────────────────────────────────────┼──────────────────┘
                                               │
                                               ▼
                        ┌─────────────────────────────────────┐
                        │  useFolder(root)                     │
                        │                                      │
                        │  items: ListItem[]                   │
                        │  loading: boolean                    │
                        │  error: string | null                │
                        │                                      │
                        │  subscribes internally to root.path  │
                        │  re-renders on any change below "/"  │
                        └────────────────┬────────────────────┘
                                         │
                                         │  filesystem mutates
                                         │
                        ┌────────────────▼────────────────────┐
                        │  useAction(() => root.newFile(...))  │
                        │                                      │
                        │  run: () => void                     │
                        │  loading: boolean                    │
                        │  error: string | null                │
                        │  reset: () => void                   │
                        └─────────────────────────────────────┘
```

The flow:
1. `useExplorer` opens the filesystem and provides a `root` `ExplorerFolder`.
2. `useFolder(root)` subscribes to changes at `root.path` and lists its contents.
3. `useAction` runs a mutation (e.g., `root.newFile`).
4. The mutation triggers the event system internally.
5. `useFolder` receives the change notification and re-renders with the updated list.

No Redux, no Context, no manual state synchronization needed.

---

## Minimal Full Example

```tsx
import { useExplorer, useFolder, useAction } from 'buritifs/react';

export function App() {
  const explorer = useExplorer('my-app');

  if (explorer.status === 'loading') return <p>Opening filesystem...</p>;
  if (explorer.status === 'error') return <p>Error: {explorer.error}</p>;

  return <WorkArea root={explorer.root} />;
}

function WorkArea({ root }) {
  const { items, loading } = useFolder(root);

  const deleteFile = useAction(() =>
    root.tree.delete({ path: items[0]?.path ?? '' })
  );

  if (loading) return <p>Loading...</p>;

  return (
    <ul>
      {items.map(item => (
        <li key={item.path}>{item.path}</li>
      ))}
    </ul>
  );
}
```

---

## Lifecycle Summary

| Event | What happens |
|---|---|
| Component mounting `useExplorer` | Opens IDB connection, runs 3-phase recovery, resolves to `root` |
| Component mounting `useFolder` | Calls `list()` once, sets up `subscribe()` internally |
| Mutation runs via `useAction` | Mutation completes, event fires, `useFolder` re-renders |
| Component unmounting `useExplorer` | Calls `tree.close()`, removes IDB from registry |
| Component unmounting `useFolder` | Calls unsubscribe function, no memory leak |

---

## Detailed References

- [useExplorer](use-explorer.md) — full API, lifecycle details, multiple databases
- [useFolder](use-folder.md) — options, pagination, navigation between folders
- [useAction](use-action.md) — loading state, error handling, reset
