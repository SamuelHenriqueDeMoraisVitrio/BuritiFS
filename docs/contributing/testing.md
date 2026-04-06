# Testing Guide

BuritiFS has two test environments configured in Vitest: a Node.js environment for the core filesystem classes and a happy-dom environment for the React hooks. This document explains the test structure, the helpers available, and how to add new tests following the existing patterns.

---

## Test Structure

```
tests/
├── helpers/
│   ├── opfs-mock.ts      # Custom OPFS mock (simulates navigator.storage.getDirectory)
│   ├── dataHelper.ts     # Direct IDB inspection — read DB state without going through the lib
│   └── fixtures.ts       # createTreeAndRoot() — creates a live ExplorerTree and root folder
├── ExplorerTree/         # Tests for ExplorerTree methods
│   ├── newFile.test.ts
│   ├── newFolder.test.ts
│   ├── delete.test.ts
│   ├── copy.test.ts
│   ├── move.test.ts
│   ├── rename.test.ts
│   ├── list.test.ts
│   ├── exists.test.ts
│   ├── size.test.ts
│   ├── write.test.ts
│   ├── read.test.ts
│   └── ...
├── ExplorerFolder/       # Tests for ExplorerFolder methods
│   ├── newFile.test.ts
│   ├── newFolder.test.ts
│   └── ...
├── ExplorerFile/         # Tests for ExplorerFile methods
│   ├── write.test.ts
│   ├── read.test.ts
│   ├── rename.test.ts
│   └── ...
└── react/                # Tests for React hooks
    ├── useExplorer.test.tsx
    ├── useFolder.test.tsx
    └── useAction.test.tsx
```

---

## Vitest Configuration

Two Vitest projects are configured in `vitest.config.ts`:

| Project name | Environment | Files |
|---|---|---|
| `node` | `node` | `tests/ExplorerTree/**`, `tests/ExplorerFolder/**`, `tests/ExplorerFile/**` |
| `happy-dom` | `happy-dom` | `tests/react/**` |

The `node` project uses `fake-indexeddb` (configured in `setup` files) so that IndexedDB is available in Node.js without a browser. The `happy-dom` project provides a DOM environment required by React Testing Library.

---

## Test Helpers

### `opfs-mock.ts` — OPFS Mock

Because Node.js has no `navigator.storage.getDirectory`, the test suite provides a custom mock. It implements the same interface as the browser OPFS API using an in-memory `Map<string, Uint8Array>`:

```typescript
import { setupOpfsMock } from '../helpers/opfs-mock';

beforeEach(() => {
  setupOpfsMock(); // installs mock on globalThis.navigator.storage
});
```

The mock supports:
- `getDirectory()` — returns a mock `FileSystemDirectoryHandle`.
- `getFileHandle(name, { create })` — gets or creates a file entry.
- `remove()` — deletes a file entry.
- `createWritable()` — returns a writable stream backed by the in-memory map.
- `getFile()` — returns a `File` object from stored bytes.
- `values()` — iterates all stored file handles (used by `recoverOrphans`).

Each test that calls `setupOpfsMock()` gets a fresh, empty in-memory store.

---

### `dataHelper.ts` — Direct IDB Inspection

`dataHelper.ts` provides functions to read IndexedDB state directly, bypassing the BuritiFS API. Use this to assert on internal state that the public API doesn't expose — for example, verifying that the WAL sets `status: 'pending'` before writing, or that a node's `contentId` matches what's stored in OPFS.

```typescript
import { getAllNodes, getNodeByPath } from '../helpers/dataHelper';

// Get all records from the "nodes" store
const records = await getAllNodes(dbName);

// Get a specific record
const record = await getNodeByPath(dbName, '/docs/readme.txt');
console.log(record?.status); // 'ready'
console.log(record?.contentId); // e.g., "1712345678000"
```

Available helpers:

```typescript
function getAllNodes(dbName: string): Promise<TableBuritiTypeBD[]>
function getNodeByPath(dbName: string, path: string): Promise<TableBuritiTypeBD | undefined>
function getNodesByParent(dbName: string, parent: string): Promise<TableBuritiTypeBD[]>
function getNodesByStatus(dbName: string, status: 'pending' | 'ready'): Promise<TableBuritiTypeBD[]>
```

---

### `fixtures.ts` — `createTreeAndRoot()`

Most tests need a live `ExplorerTree` instance and the root `ExplorerFolder`. `createTreeAndRoot()` sets this up with a unique database name per test:

```typescript
import { createTreeAndRoot } from '../helpers/fixtures';

let root: ExplorerFolder;
let tree: ExplorerTree;

beforeEach(async () => {
  ({ root, tree } = await createTreeAndRoot());
});

afterEach(() => {
  tree.close();
});
```

Internally, `createTreeAndRoot()` calls `ExplorerTree.create({ name: crypto.randomUUID() })` to ensure test isolation — each test gets its own fresh IndexedDB database.

---

## Test Patterns

Each test file follows a consistent structure with three `describe` blocks:

### `describe('success')`
Tests that the operation works correctly under normal conditions:

```typescript
describe('success', () => {
  it('creates a file at the given path', async () => {
    const file = await tree.newFile({ path: '/docs/readme.txt' });

    expect(file.ok).toBe(true);
    if (!file.ok) return;

    expect(file.path).toBe('/docs/readme.txt');
    expect(file.type).toBe('file');

    const exists = await tree.exists({ path: '/docs/readme.txt' });
    expect(exists).toBe(true);
  });
});
```

### `describe('error')`
Tests that operations fail correctly with meaningful error messages:

```typescript
describe('error', () => {
  it('fails when parent does not exist', async () => {
    const result = await tree.newFile({ path: '/nonexistent/file.txt' });

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(typeof result.error).toBe('string');
    expect(result.error.length).toBeGreaterThan(0);
  });

  it('fails when path already exists', async () => {
    await tree.newFile({ path: '/docs/readme.txt' });
    const duplicate = await tree.newFile({ path: '/docs/readme.txt' });

    expect(duplicate.ok).toBe(false);
  });
});
```

### `describe('sanitization')`
Tests that path normalization works correctly — trailing slashes removed, leading slash added, errors for invalid characters:

```typescript
describe('sanitization', () => {
  it('adds leading slash if missing', async () => {
    // Paths without leading slash are normalized
    const file = await tree.newFile({ path: 'docs/readme.txt' });

    expect(file.ok).toBe(true);
    if (!file.ok) return;

    expect(file.path).toBe('/docs/readme.txt');
  });

  it('fails for paths with spaces', async () => {
    const result = await tree.newFile({ path: '/my file.txt' });

    expect(result.ok).toBe(false);
  });
});
```

---

## React Hook Tests

React hook tests use `@testing-library/react` and run in the `happy-dom` environment. The OPFS mock and `fake-indexeddb` are still active.

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useExplorer } from '../../src/react/index';

describe('useExplorer', () => {
  it('transitions from loading to ready', async () => {
    const { result } = renderHook(() => useExplorer('test-db'));

    expect(result.current.status).toBe('loading');

    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });
  });
});
```

---

## Adding New Tests

1. Identify which class the method belongs to (`ExplorerTree`, `ExplorerFolder`, `ExplorerFile`, or a hook).
2. Create or open the appropriate test file under `tests/<ClassName>/`.
3. Import `createTreeAndRoot` from `fixtures.ts`.
4. Add `beforeEach` / `afterEach` to set up and tear down the filesystem.
5. Add three `describe` blocks: `success`, `error`, `sanitization`.
6. Follow the TypeScript narrowing pattern — check `result.ok` before accessing result fields.

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTreeAndRoot } from '../helpers/fixtures';
import type { ExplorerTree, ExplorerFolder } from '../../src/index';

let tree: ExplorerTree;
let root: ExplorerFolder;

beforeEach(async () => {
  ({ tree, root } = await createTreeAndRoot());
});

afterEach(() => {
  tree.close();
});

describe('ExplorerTree.yourMethod', () => {
  describe('success', () => {
    it('does the thing correctly', async () => {
      // ...
    });
  });

  describe('error', () => {
    it('fails with a meaningful error when...', async () => {
      // ...
    });
  });

  describe('sanitization', () => {
    it('normalizes paths correctly', async () => {
      // ...
    });
  });
});
```
