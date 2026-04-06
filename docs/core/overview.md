# Core Architecture Overview

This document explains the internal structure of BuritiFS — how the classes relate to each other, why the storage is split across two browser APIs, and how paths, events, and the façade pattern work together.

---

## Inheritance Hierarchy

BuritiFS is built as a single deep inheritance chain. Each layer adds a specific responsibility on top of the previous one:

```
ExplorerTree          ← public API surface, event system, static create()
    │
    └─ extends StorageInit      ← initialization orchestration, 3-phase recovery
           │
           └─ extends IDBRefactor     ← copy, move, rename operations
                  │
                  └─ extends IDBQuery      ← list, exists, size queries
                         │
                         └─ extends IDBNodes     ← add and remove individual nodes
                                │
                                └─ extends OPFSStorage  ← OPFS file read/write
                                       │
                                       └─ extends IDBSetup  ← IndexedDB open/close,
                                                              transactions, WAL helper,
                                                              static DB registry
```

The chain is intentionally structured so that each layer depends only on the layers below it, never the layers above. This means, for example, `IDBQuery` can call `IDBNodes` methods (which it extends), but never calls `ExplorerTree` methods.

> **Note:** Deep inheritance is the current design choice that keeps all internal state in one object. It is a candidate for future refactoring into composition. See [Architecture Decisions](../contributing/architecture.md) for context.

---

## What Each Layer Does

### `IDBSetup` — Database foundation

- Opens IndexedDB under the given `name` using a static registry (`Map<string, IDBDatabase>`) to avoid duplicate connections.
- Creates the `nodes` object store with five indices: `type`, `parent`, `contentId`, `status`, and the primary key `path`.
- Provides `transact(mode, fn)` — a thin wrapper that opens a transaction, calls `fn(store)`, and resolves when the transaction completes.
- Provides `withWAL(data, action)` — the Write-Ahead Log helper. See the WAL section below.
- `pathTrated(path)` — normalizes a path string (prepend `/`, strip trailing `/`).
- `close()` — removes the database from the static registry and closes the connection.

### `OPFSStorage` — Binary file content

- Calls `navigator.storage.getDirectory()` to get the OPFS root.
- Stores each file's binary content as a file named after the file's `contentId` (a random numeric string), not its user-facing path. This decouples content from metadata — renaming a file in IDB does not require moving anything in OPFS.
- Methods: `openStorage()`, `writeStorage(id, content)`, `readStorage(id)`, `readTextStorage(id)`, `deleteStorage(id)`, `existsStorage(id)`.

### `IDBNodes` — Node lifecycle

- `addNode(data)` — inserts a folder or file record into IDB. For files, calls `withWAL` to bracket the OPFS write.
- `removeNode(path)` — deletes a node. For folders, cascades down and deletes all descendants from both IDB and OPFS.
- `getSource(path)` — retrieves a raw IDB record for a path.

### `IDBQuery` — Read-only queries

- `existsNode(path)` — checks if a path exists in IDB.
- `listNodes(path, options)` — returns children (or all descendants with `recursive: true`) sorted and optionally paginated.
- `sizeNode(path, options)` — sums the byte sizes of all OPFS files under a path.

### `IDBRefactor` — Structural mutations

- `copyNode(fromPath, toPath, options)` — deep-copies a node tree. Supports `merge` (keep destination items that don't conflict) and `priority` (`'source'` or `'destination'` wins when both have the same path).
- `moveNode(fromPath, toPath, options)` — moves a node. Guards against moving a folder into one of its own descendants.

### `StorageInit` — Initialization and recovery

- Calls `openDB()` then `openStorage()` to bring both storages online.
- Runs three recovery phases in sequence:
  1. **`recoverPending`** — removes any node left with `status: 'pending'`, meaning the WAL action never completed.
  2. **`recoverOrphans`** — finds OPFS files with no matching IDB record (orphaned content) and deletes them.
  3. **`recoverBroken`** — finds IDB file records whose OPFS content no longer exists and removes them.

### `ExplorerTree` — Public API and event bus

- Exposes all user-facing methods: `newFolder`, `newFile`, `delete`, `copy`, `move`, `rename`, `list`, `exists`, `size`, `write`, `read`, `info`, `type`, `source`, `subscribe`, `close`.
- Maintains an internal `Map<string, Set<() => void>>` for subscriptions.
- After every successful mutation, calls an internal `notify(path)` that walks up the directory tree, calling every subscriber registered on the changed path and all of its ancestors.
- Exposes `static async create(props)` as the only public constructor. Returns an `ExplorerFolder` pointing to `"/"` on success, or `{ ok: false, error }` on failure.

---

## Two Storages, One Reason Each

**OPFS** (Origin Private File System) is optimized for large binary blobs. It exposes a real file handle you can write `ArrayBuffer` data to efficiently, without the overhead of serializing through IndexedDB's structured clone algorithm. However, OPFS has no query capability — you cannot ask "give me all files whose parent is `/docs`".

**IndexedDB** is a transactional, indexed key-value store. It excels at metadata queries: find all children of a path, find all nodes with status `'pending'`, find a node by its content ID. However, it is not efficient for large binary blobs.

BuritiFS stores each file's content in OPFS (referenced by a numeric `contentId`) and stores all metadata — path, parent, type, timestamps, status, contentId — in IndexedDB. This means:
- Queries (list, exists, size) hit only IDB — fast index scans.
- Content reads/writes hit only OPFS — efficient binary I/O.
- Moving or renaming a file only updates IDB records — the OPFS file stays untouched.

---

## The Façade Pattern: ExplorerFolder and ExplorerFile

`ExplorerFolder` and `ExplorerFile` are thin façades over `ExplorerTree`. They hold a reference to the tree instance and a `path` string, and they delegate every operation to the tree:

```typescript
// ExplorerFolder.newFile({ name }) delegates to:
this.tree.newFile({ path: `${this.path}/${name}` })

// ExplorerFile.write({ content }) delegates to:
this.tree.write({ path: this.path, content })
```

This means:
- You get a more ergonomic API — pass `{ name }` instead of full paths when working inside a folder.
- The tree remains the single source of truth. There is no state duplication.
- `ExplorerFolder.tree` exposes the underlying `ExplorerTree` instance directly for when you need the full-path API.

Both classes carry `ok: true` and `error: null` as constant properties so they fit the same discriminated union as error results:

```typescript
const result = await root.newFile({ name: 'x.txt' });

if (!result.ok) {
  // result is { ok: false, error: string }
  return;
}

// result is ExplorerFile — result.ok is true, result.error is null
```

---

## Path Normalization

All paths are normalized through `validatePath()` before any storage operation:

| Input | Output |
|---|---|
| `"docs/readme.txt"` | `"/docs/readme.txt"` |
| `"/docs/readme.txt/"` | `"/docs/readme.txt"` |
| `"/"` | `"/"` |
| `"/docs//readme.txt"` | error: double slash not allowed |
| `"/docs/my file.txt"` | error: spaces not allowed |

Normalization rules:
1. Prepend `/` if the path does not start with it.
2. Remove trailing `/` (except for root `/`).
3. Reject paths containing spaces.
4. Reject paths containing `//`.

The parent of a path is derived by dropping the last segment: `/docs/notes/readme.txt` → parent is `/docs/notes`.

---

## Event Propagation

When a mutation succeeds, the tree calls `notify(affectedPath)`. The notify function:

1. Calls all callbacks registered for `affectedPath`.
2. Computes the parent path (e.g., `/docs/notes` → `/docs`).
3. Calls all callbacks registered for the parent.
4. Continues up to and including `/`.

This means subscribing to `/` makes you an observer for the entire filesystem. Subscribing to `/projects` makes you an observer for everything under `projects/`.

See [Events](events.md) for integration examples.

---

## Related Documents

- [ExplorerTree reference](explorer-tree.md)
- [ExplorerFolder reference](explorer-folder.md)
- [ExplorerFile reference](explorer-file.md)
- [Error handling patterns](error-handling.md)
- [Event system in depth](events.md)
- [Architecture decisions](../contributing/architecture.md)
