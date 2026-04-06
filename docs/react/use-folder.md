# useFolder

`useFolder` lists the contents of a folder and keeps the list up to date. It subscribes to filesystem changes internally, so any mutation to the folder's contents automatically triggers a re-render — no manual state management needed.

---

## Import

```typescript
import { useFolder } from 'buritifs/react';
```

---

## Signature

```typescript
function useFolder(
  folder: ExplorerFolder,
  options?: {
    recursive?: boolean;
    filter?: (item: ListItem) => boolean;
  }
): {
  items: ListItem[];
  loading: boolean;
  error: string | null;
}
```

### Parameters

| Name | Type | Default | Description |
|---|---|---|---|
| `folder` | `ExplorerFolder` | required | The folder to observe. |
| `options.recursive` | `boolean` | `false` | If `true`, includes all descendants, not just direct children. |
| `options.filter` | `(item: ListItem) => boolean` | — | A predicate to exclude items from the result. |

### Return value

| Field | Type | Description |
|---|---|---|
| `items` | `ListItem[]` | The current contents of the folder. Empty array until first load completes. |
| `loading` | `boolean` | `true` on the initial load and after any change triggers a reload. |
| `error` | `string \| null` | Error message if the last `list()` call failed; `null` otherwise. |

`ListItem`:

```typescript
type ListItem = {
  path: string;
  type: 'file' | 'folder';
  createdAt: number; // Unix timestamp in ms
  updatedAt: number; // Unix timestamp in ms
};
```

---

## Example — Basic Usage

```tsx
import { useFolder } from 'buritifs/react';
import type { ExplorerFolder } from 'buritifs';

function FileList({ folder }: { folder: ExplorerFolder }) {
  const { items, loading, error } = useFolder(folder);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  if (items.length === 0) {
    return <p>This folder is empty.</p>;
  }

  return (
    <ul>
      {items.map(item => (
        <li key={item.path}>
          {item.type === 'folder' ? '📁' : '📄'} {item.path}
        </li>
      ))}
    </ul>
  );
}
```

---

## Example — Recursive with Filter

List only `.ts` files anywhere inside the folder tree:

```tsx
function TypeScriptFiles({ folder }: { folder: ExplorerFolder }) {
  const { items, loading } = useFolder(folder, {
    recursive: true,
    filter: item => item.type === 'file' && item.path.endsWith('.ts'),
  });

  if (loading) return <p>Scanning...</p>;

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

## Example — Navigating Between Folders

`useFolder` reacts to the `folder` prop changing. Pass a different `ExplorerFolder` to navigate:

```tsx
import { useState } from 'react';
import { useFolder } from 'buritifs/react';
import type { ExplorerFolder, ListItem } from 'buritifs';

function Explorer({ root }: { root: ExplorerFolder }) {
  const [current, setCurrent] = useState(root);
  const { items, loading } = useFolder(current);

  async function navigate(item: ListItem) {
    if (item.type !== 'folder') return;

    const result = await root.tree.source({ path: item.path });
    if (result.ok && result.type === 'folder') {
      setCurrent(result);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <p>Current: {current.path}</p>
      {current.path !== '/' && (
        <button onClick={() => navigate({ path: current.path, type: 'folder', createdAt: 0, updatedAt: 0 })}>
          ← Up
        </button>
      )}
      <ul>
        {items.map(item => (
          <li
            key={item.path}
            onClick={() => navigate(item)}
            style={{ cursor: item.type === 'folder' ? 'pointer' : 'default' }}
          >
            {item.type === 'folder' ? '📁' : '📄'} {item.path.split('/').at(-1)}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

When `current` changes (new `ExplorerFolder` passed), `useFolder`:
1. Unsubscribes from the previous folder's path.
2. Subscribes to the new folder's path.
3. Calls `list()` immediately with the new folder.

---

## How Reactivity Works

Internally, `useFolder` does two things:

1. Calls `folder.list(options)` and stores the result in state.
2. Calls `folder.tree.subscribe(folder.path, reload)` to re-run `list()` whenever anything at or below `folder.path` changes.

This means:
- Creating a file inside the folder triggers a reload.
- Deleting a file inside the folder triggers a reload.
- Renaming or moving a file inside the folder triggers a reload.
- Changes in nested subdirectories also trigger a reload (events bubble upward through the tree).

The subscription is automatically removed when the component unmounts.

---

## Initial Loading State

`loading` is `true` on the first render because `list()` is async. Your component should always handle `loading: true`:

```tsx
// Without this check, items.map() runs on an empty array before data arrives
// — this is safe but produces no output on first render
const { items, loading } = useFolder(folder);

if (loading && items.length === 0) {
  return <Skeleton />;
}
```

After the initial load, `loading` briefly returns to `true` every time a change triggers a reload. Whether to show a loading indicator during re-loads depends on your UI preference — often it is fine to keep showing the old `items` while the new list loads.

---

## Error State

`error` is set when `folder.list()` returns `{ ok: false }`. This can happen if:
- The folder was deleted after the component mounted.
- An IndexedDB transaction failed (rare).

```tsx
const { items, loading, error } = useFolder(folder);

if (error) {
  return <p>Could not load folder: {error}</p>;
}
```

---

## Related

- [useExplorer](use-explorer.md) — provides the `root` ExplorerFolder
- [useAction](use-action.md) — triggers mutations that reactively update `useFolder`
- [Events](../core/events.md) — how the subscription system works
