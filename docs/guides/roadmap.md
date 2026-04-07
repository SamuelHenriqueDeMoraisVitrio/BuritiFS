# Roadmap

This document describes what BuritiFS has implemented today and what is planned for future releases.

---

## What Is Implemented Today

### Core filesystem

- **`ExplorerTree`** — full-featured filesystem manager with path-based API.
- **`ExplorerFolder`** — path-scoped folder façade with relative `name`-based methods.
- **`ExplorerFile`** — path-scoped file façade for read/write operations.
- **`create`, `source`, `info`, `type`** — node creation and inspection.
- **`newFolder`, `newFile`** — node creation.
- **`delete`** — recursive deletion.
- **`copy`** — deep copy with merge and priority options.
- **`move`** — atomic move with force option.
- **`rename`** — in-place rename.
- **`list`** — paginated directory listing with filter and recursive options.
- **`exists`, `size`** — query operations.
- **`write`, `read`** — file content I/O (string, ArrayBuffer, or object).

### Consistency and recovery

- **WAL (Write-Ahead Log)** — `status: 'pending'` before OPFS writes, `'ready'` after.
- **3-phase crash recovery** on every initialization:
  - `recoverPending` — cleans up interrupted operations.
  - `recoverOrphans` — removes OPFS content with no IDB record.
  - `recoverBroken` — removes IDB records with no OPFS content.

### Reactivity

- **`subscribe(path, fn)`** — event subscription with automatic upward propagation.
- Unsubscribe function returned by `subscribe`.

### React integration

- **`useExplorer(name)`** — opens filesystem, manages lifecycle.
- **`useFolder(folder, options?)`** — reactive directory listing.
- **`useAction(fn)`** — mutation wrapper with loading/error/reset state.

### Interactive example

A full browser-based code editor backed by BuritiFS is live at [samuelhenriquedemoraisvitrio.github.io/BuritiFS](https://samuelhenriquedemoraisvitrio.github.io/BuritiFS/). It demonstrates the React hooks, file explorer, tab management, and persistent OPFS/IDB storage with no backend.

### Build and packaging

- Dual ESM/CJS output via `tsup`.
- Two entry points: `buritifs` (core) and `buritifs/react` (hooks).
- Full TypeScript declarations (`.d.ts`).
- Source maps.
- Automated releases via **semantic-release** — every push to `main` with a releasable commit automatically bumps the version, generates `CHANGELOG.md`, publishes to npm, and creates a GitHub Release.

---

## Planned

### `useFile` — Reactive File Content Hook

A React hook that reads a file's content and re-renders automatically whenever the file is written to:

```tsx
// Planned API
function Editor({ file }: { file: ExplorerFile }) {
  const { text, loading, error } = useFile(file);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return <textarea defaultValue={text} />;
}
```

This requires subscribing to write events on the file's path and re-reading on each change.

---

### Synchronous OPFS via Web Worker

OPFS supports a synchronous access handle (`createSyncAccessHandle`) that is dramatically faster than the async API, but it is only available inside a dedicated Web Worker. The plan is to:

1. Spawn a Worker that owns the synchronous OPFS handle.
2. Route all `write` and `read` calls through the Worker via `postMessage`.
3. Expose the same API surface with no breaking changes.

This would significantly improve performance for workloads that write many small files (e.g., an in-browser build tool or a game with frequent autosaves).

---

### GitHub Sync

A one-command sync between the local BuritiFS filesystem and a GitHub repository:

```typescript
// Planned API (conceptual)
import { syncToGitHub } from 'buritifs/github';

await syncToGitHub({
  tree,
  repo: 'username/my-project',
  branch: 'main',
  token: ghToken,
});
```

This would use the GitHub Contents API to push files from OPFS to a repository and pull changes back down, enabling a simple cloud backup or collaboration layer on top of BuritiFS.

---

### Vue 3 Composables

First-party `useExplorer` and `useFolder` composables for Vue 3, published at `buritifs/vue`:

```typescript
// Planned
import { useExplorer, useFolder } from 'buritifs/vue';
```

---

### Svelte 5 Runes Integration

First-party Svelte 5 reactive primitives using the runes API (`$state`, `$derived`, `$effect`), published at `buritifs/svelte`.

---

## How to Suggest Features

Open an issue on the GitHub repository describing:
- The use case you're trying to solve.
- What API you'd expect.
- Any constraints or browser compatibility requirements.

Bug reports are also welcome — please include the browser version, a minimal reproduction, and the error message from `result.error`.
