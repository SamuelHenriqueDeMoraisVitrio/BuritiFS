# useExplorer

`useExplorer` opens a named BuritiFS filesystem and manages its lifecycle. On mount, it initializes the IndexedDB connection and runs the crash-recovery phases. On unmount, it closes the connection cleanly.

---

## Import

```typescript
import { useExplorer } from 'buritifs/react';
```

---

## Signature

```typescript
function useExplorer(name: string): UseExplorerState

type UseExplorerState =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; root: ExplorerFolder }
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `name` | `string` | The filesystem name. Maps to an IndexedDB database. Must be unique per logical filesystem. |

### Return value

A discriminated union with three possible shapes:

| Shape | When | Contents |
|---|---|---|
| `{ status: 'loading' }` | Before the filesystem is ready | No additional fields |
| `{ status: 'error'; error: string }` | If initialization fails | `error` — human-readable message |
| `{ status: 'ready'; root: ExplorerFolder }` | After successful init | `root` — `ExplorerFolder` at `"/"` |

---

## Example — Handling All Three States

```tsx
import { useExplorer } from 'buritifs/react';

export function App() {
  const explorer = useExplorer('my-app');

  if (explorer.status === 'loading') {
    return (
      <div className="loading-screen">
        <p>Opening filesystem...</p>
      </div>
    );
  }

  if (explorer.status === 'error') {
    return (
      <div className="error-screen">
        <p>Could not open filesystem: {explorer.error}</p>
        <p>Make sure your browser supports OPFS and IndexedDB.</p>
      </div>
    );
  }

  // explorer.status === 'ready'
  // explorer.root is an ExplorerFolder at "/"
  return <WorkArea root={explorer.root} />;
}
```

---

## Example — TypeScript with Type Guards

```typescript
import { useExplorer } from 'buritifs/react';
import type { ExplorerFolder } from 'buritifs';

export function App() {
  const explorer = useExplorer('my-app');

  // TypeScript narrows correctly in each branch:
  if (explorer.status !== 'ready') {
    return null; // or a loading/error UI
  }

  // Here TypeScript knows explorer.root: ExplorerFolder
  const root: ExplorerFolder = explorer.root;

  return <Dashboard root={root} />;
}
```

---

## Lifecycle

1. **Mount** — `useExplorer` calls `ExplorerTree.create({ name })` asynchronously.
   - Sets status to `'loading'` immediately.
   - Awaits the initialization (opens IDB, opens OPFS, runs 3-phase recovery).
   - On success: sets status to `'ready'`, `root` to the root `ExplorerFolder`.
   - On failure: sets status to `'error'`, `error` to the error message.

2. **During lifetime** — the underlying `ExplorerTree` connection stays open. All hooks and direct tree calls share this single connection.

3. **Unmount** — `useExplorer` calls `ExplorerTree.close({ name })`, removing the database from the internal registry. If you remount the same name, a fresh connection is established.

---

## Using Multiple Filesystems

Each unique `name` maps to a separate IndexedDB database. You can have multiple `useExplorer` hooks in the same app for different namespaces:

```tsx
function App() {
  const projectsFS = useExplorer('projects');
  const settingsFS = useExplorer('settings');

  if (projectsFS.status !== 'ready' || settingsFS.status !== 'ready') {
    return <p>Loading...</p>;
  }

  return (
    <>
      <ProjectBrowser root={projectsFS.root} />
      <SettingsPanel root={settingsFS.root} />
    </>
  );
}
```

---

## Where to Call It

Call `useExplorer` once near the root of your app and pass `root` down to child components via props or React Context. Calling it at a low level in the tree means the database connection opens and closes every time that component mounts/unmounts.

```tsx
// Good — called once near the root
function App() {
  const explorer = useExplorer('my-app');
  if (explorer.status !== 'ready') return <LoadingScreen />;
  return <RootContext.Provider value={explorer.root}>...</RootContext.Provider>;
}

// Problematic — each list item opens and closes its own connection
function FileItem({ path }) {
  const explorer = useExplorer('my-app'); // reopens on every render cycle
  ...
}
```

---

## Initialization Errors

The `status: 'error'` state occurs when:

- The browser does not support OPFS (`navigator.storage.getDirectory` is unavailable).
- The browser does not support IndexedDB.
- An IndexedDB version conflict occurs (rare in production).

Check [Browser Support](../guides/browser-support.md) for the full compatibility matrix and feature-detection code.
