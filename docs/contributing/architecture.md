# Architecture Decisions

This document explains the key design decisions behind BuritiFS — why specific approaches were chosen and what trade-offs they involve. Understanding these choices helps when contributing or evaluating whether BuritiFS is the right tool for a use case.

---

## Why Two Storage APIs?

BuritiFS stores file **content** in OPFS and file **metadata** in IndexedDB. These are complementary APIs that each solve a different problem.

### OPFS for content

OPFS (Origin Private File System) exposes real file handles you can write `ArrayBuffer` data to efficiently. The underlying implementation in Chrome and Safari maps directly to real filesystem files on disk, making reads and writes fast even for large binary files. However, OPFS has no query interface — you cannot ask "give me all files with parent `/docs`". You can only iterate or address files by handle.

### IndexedDB for metadata

IndexedDB is a transactional, indexed key-value store optimized for structured data. With proper indices, you can efficiently query: "give me all nodes where `parent = '/docs'`", or "find all nodes with `status = 'pending'`". However, IndexedDB serializes data through the structured clone algorithm, which makes storing large binary blobs slow and memory-intensive.

### The split

BuritiFS stores each file's binary content in OPFS using a random numeric `contentId` as the filename. The `contentId` is stored in the IndexedDB record alongside the path, parent, timestamps, and status. This means:

- **Queries hit only IDB** — fast index scans for listing, filtering, and existence checks.
- **Content I/O hits only OPFS** — efficient binary reads and writes.
- **Renaming a file only updates IDB** — no OPFS file needs to move. The content stays at the same `contentId`; only the path record in IDB changes.
- **Deleting a file removes both** — the IDB record and the OPFS file identified by `contentId`.

---

## Write-Ahead Log (WAL)

The WAL ensures that OPFS content and IDB metadata stay consistent even if the browser crashes or the tab is closed mid-operation.

### The problem

Writing a file requires two steps: storing the content in OPFS and recording the metadata in IDB. If the process is interrupted between these steps, the two storages diverge — one has data the other doesn't.

### The solution

Every file write follows this sequence:

```
1. Mark node as status: 'pending' in IDB
2. Write content to OPFS
3. Mark node as status: 'ready' in IDB
```

If the process crashes between steps 1 and 2, the IDB record exists with `status: 'pending'` but OPFS has no content.
If the process crashes between steps 2 and 3, OPFS has content but IDB still shows `status: 'pending'`.

In both cases, recovery cleans up the inconsistency on the next initialization.

### Implementation

The WAL helper in `IDBSetup`:

```typescript
protected async withWAL(
  data: TableBuritiTypeBD,
  action: () => Promise<void>
): Promise<void> {
  // Step 1: mark pending
  await this.transact('readwrite', store => store.put({ ...data, status: 'pending' }));

  // Step 2: OPFS write (or whatever action)
  await action();

  // Step 3: mark ready
  await this.transact('readwrite', store => store.put({ ...data, status: 'ready' }));
}
```

---

## 3-Phase Recovery

On every `ExplorerTree.create()` call, three recovery phases run sequentially before the filesystem is considered ready. This happens even on clean startups (the queries return no results quickly) to guarantee consistency.

### Phase 1: `recoverPending`

Queries all IDB nodes with `status: 'pending'`. These represent interrupted writes. For each:
- Delete the IDB record.
- If the node is a file, delete the corresponding OPFS file (if it exists).

Result: no `'pending'` nodes remain in IDB.

### Phase 2: `recoverOrphans`

Iterates all files in the OPFS directory. For each file (identified by its name, which is the `contentId`):
- Query IDB for a record with that `contentId`.
- If no record exists, delete the OPFS file.

Result: no unreferenced files remain in OPFS.

### Phase 3: `recoverBroken`

Queries all file nodes in IDB. For each:
- Check if the corresponding OPFS file (by `contentId`) exists.
- If it doesn't, delete the IDB record.

Result: no IDB records point to missing OPFS content.

After all three phases, the two storages are guaranteed to be consistent.

---

## Static IDB Registry

`IDBSetup` maintains a static `Map<string, IDBDatabase>` that holds open database connections keyed by name. When `ExplorerTree.create({ name })` is called:

1. Check if the registry already has an open connection for `name`.
2. If yes, reuse it — no new `indexedDB.open()` call.
3. If no, open a new connection and store it in the registry.

**Why this matters:** Multiple calls to `indexedDB.open()` with the same name while a connection is already open can cause `versionchange` events and unexpected blocking. By reusing connections, BuritiFS avoids this. It also means that mounting multiple `useExplorer('my-app')` hooks in different parts of the component tree does not open multiple IDB connections.

When `close()` is called, the connection is removed from the registry. The next `create()` with the same name opens a fresh connection.

---

## Event System Design

The event system uses a `Map<string, Set<() => void>>` — a dictionary from path strings to sets of callbacks. After each mutation, `notify(path)` is called with the affected path:

```typescript
private notify(path: string): void {
  // Fire callbacks for the path itself
  this.subscribers.get(path)?.forEach(fn => fn());

  // Walk up to root, firing callbacks at each level
  let current = path;
  while (current !== '/') {
    current = parentOf(current); // e.g., "/docs/notes" → "/docs"
    this.subscribers.get(current)?.forEach(fn => fn());
  }
}
```

This design has a few properties:
- Subscribing to `'/'` means observing everything.
- Subscribing to `'/projects'` means observing only changes in that subtree.
- No custom event classes or DOM event system — plain functions in a Map.
- Callbacks are called synchronously — by the time they fire, the storage is already updated.

---

## Deep Inheritance vs. Composition

BuritiFS uses a chain of seven class levels:

```
IDBSetup → OPFSStorage → IDBNodes → IDBQuery → IDBRefactor → StorageInit → ExplorerTree
```

This is a **deliberate but revisable** design choice. The motivation was to keep all internal state (the IDB connection, the OPFS directory handle, the subscriber map) in a single object with a clear layered API — each layer adds methods and relies only on the layers below it.

**Trade-offs:**
- **Upside:** Simple to follow — each class file has a focused responsibility, and TypeScript's inheritance gives you `protected` access to internal methods without exposing them publicly.
- **Downside:** The chain is deep. Adding a cross-cutting concern (e.g., logging) requires modifying multiple layers. Testing lower layers in isolation requires instantiating the full chain.

A future refactor may replace inheritance with composition (inject `IDBNodes`, `OPFSStorage`, etc. as dependencies into `ExplorerTree`). The public API surface would remain unchanged.

---

## The Façade Pattern

`ExplorerFolder` and `ExplorerFile` are deliberately thin. They hold a path and a reference to `ExplorerTree`, and every method delegates to the tree:

```typescript
// ExplorerFolder.newFile
async newFile({ name }: { name: string }) {
  return this._tree.newFile({ path: `${this.path}/${name}` });
}
```

The benefit is that there is no state duplication between the façade and the tree. The tree is always authoritative. The façade just provides a more ergonomic API for working within a specific directory scope.

`ExplorerFolder` exposes a `tree` getter that returns the underlying `ExplorerTree` for cases where the full-path API is needed.
