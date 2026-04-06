# ExplorerTree

`ExplorerTree` is the main class in BuritiFS. It owns the connection to IndexedDB and OPFS, exposes all filesystem operations, and manages the event subscription system.

You never instantiate `ExplorerTree` directly — use the static `create()` method, which returns an `ExplorerFolder` pointing to the root `"/"` on success.

---

## Static Methods

### `ExplorerTree.create(props)`

Opens (or initializes) a named filesystem. Each unique `name` maps to a separate IndexedDB database, so you can have multiple independent filesystems on the same origin.

```typescript
static async create(props: { name: string }): Promise<ExplorerFolder | { ok: false; error: string }>
```

On success, returns an `ExplorerFolder` for the root path `"/"`. The folder exposes `.tree` to access the underlying `ExplorerTree` instance.

On failure, returns `{ ok: false, error: string }`.

**Example:**

```typescript
import { ExplorerTree } from 'buritifs';

const result = await ExplorerTree.create({ name: 'my-app' });

if (!result.ok) {
  console.error('Failed to open filesystem:', result.error);
  return;
}

// result is an ExplorerFolder at "/"
const root = result;
console.log(root.path);   // "/"
console.log(root.type);   // "folder"
console.log(root.ok);     // true
console.log(root.error);  // null

// Access the ExplorerTree instance
const tree = root.tree;
```

**Error cases:**
- Browser does not support OPFS or IndexedDB.
- Database version mismatch (unlikely in production but can happen during development).

---

## Instance Methods

All instance methods are `async` and never throw. They always return a result object you can check with `.ok`.

---

### `source({ path })`

Returns the node at `path` as an `ExplorerFolder` or `ExplorerFile`. Use this when you have a path string and want the typed façade object.

```typescript
async source(props: { path: string }): Promise<ExplorerFolder | ExplorerFile | { ok: false; error: string }>
```

**Example:**

```typescript
const node = await tree.source({ path: '/docs/readme.txt' });

if (!node.ok) {
  console.error(node.error); // "path does not exist" or similar
  return;
}

if (node.type === 'file') {
  const read = await node.read();
  if (read.ok) console.log(read.text);
} else {
  const list = await node.list();
  if (list.ok) console.log(list.items);
}
```

**Error cases:**
- Path does not exist.
- Invalid path (spaces, double slashes).

---

### `info({ path })`

Returns metadata for a node: its path, creation timestamp, and last-updated timestamp.

```typescript
async info(props: { path: string }): Promise<
  | { ok: false; error: string }
  | { ok: true; error: null; path: string; createdAt: number; updatedAt: number }
>
```

**Example:**

```typescript
const result = await tree.info({ path: '/docs/readme.txt' });

if (!result.ok) {
  console.error(result.error);
  return;
}

console.log(result.path);      // "/docs/readme.txt"
console.log(result.createdAt); // Unix timestamp (ms)
console.log(result.updatedAt); // Unix timestamp (ms)
```

**Error cases:**
- Path does not exist.
- Invalid path.

---

### `type({ path })`

Returns the type of a node as a string, or `null` if the path does not exist.

```typescript
async type(props: { path: string }): Promise<'file' | 'folder' | null>
```

**Example:**

```typescript
const nodeType = await tree.type({ path: '/docs' });
// "folder", "file", or null
```

> This method does not follow the `{ ok, error }` pattern. It returns `null` for missing paths and does not report invalid path errors — use `info()` or `exists()` for those cases.

---

### `newFolder({ path })`

Creates a new folder at the given path. The parent folder must already exist.

```typescript
async newFolder(props: { path: string }): Promise<ExplorerFolder | { ok: false; error: string }>
```

**Example:**

```typescript
const folder = await tree.newFolder({ path: '/projects/my-app' });

if (!folder.ok) {
  console.error(folder.error);
  return;
}

console.log(folder.path); // "/projects/my-app"
console.log(folder.type); // "folder"
```

**Error cases:**
- Parent path does not exist (e.g., `/projects` has not been created yet).
- A node already exists at the given path.
- Invalid path (spaces, double slashes).

---

### `newFile({ path })`

Creates a new empty file at the given path. The parent folder must already exist.

```typescript
async newFile(props: { path: string }): Promise<ExplorerFile | { ok: false; error: string }>
```

**Example:**

```typescript
const file = await tree.newFile({ path: '/docs/notes.txt' });

if (!file.ok) {
  console.error(file.error);
  return;
}

console.log(file.path); // "/docs/notes.txt"
console.log(file.type); // "file"
```

**Error cases:**
- Parent path does not exist.
- A node already exists at the given path.
- Invalid path.

---

### `delete({ path })`

Deletes a node. If the node is a folder, all its descendants are deleted recursively. Cannot delete the root `"/"`.

```typescript
async delete(props: { path: string }): Promise<{ ok: true; error: null } | { ok: false; error: string }>
```

**Example:**

```typescript
const result = await tree.delete({ path: '/projects/old-app' });

if (!result.ok) {
  console.error(result.error);
  return;
}

// "/projects/old-app" and everything inside it is gone
```

**Error cases:**
- Path does not exist.
- Attempt to delete root `"/"`.
- Invalid path.

---

### `copy({ fromPath, toPath, merge?, priority? })`

Copies a node or folder tree from `fromPath` to `toPath`. If `toPath` already exists:
- Without `merge`: fails with an error.
- With `merge: true`: merges the trees. When both source and destination have a node at the same sub-path, `priority` decides which one wins.

```typescript
async copy(props: {
  fromPath: string;
  toPath: string;
  merge?: boolean;
  priority?: 'source' | 'destination';
}): Promise<{ ok: true; error: null } | { ok: false; error: string }>
```

**Example — simple copy:**

```typescript
const result = await tree.copy({
  fromPath: '/templates/default',
  toPath: '/projects/new-project',
});

if (!result.ok) {
  console.error(result.error); // e.g., "destination already exists"
}
```

**Example — merge, source wins conflicts:**

```typescript
const result = await tree.copy({
  fromPath: '/updates/patch',
  toPath: '/projects/my-app',
  merge: true,
  priority: 'source',
});
```

**Error cases:**
- `fromPath` does not exist.
- `toPath` already exists and `merge` is not set.
- `fromPath` and `toPath` are the same.
- Invalid paths.

---

### `move({ fromPath, toPath, force? })`

Moves a node from `fromPath` to `toPath`. If `toPath` already exists and `force` is not set, the operation fails. With `force: true`, the existing node at `toPath` is deleted before moving.

Cannot move a folder into one of its own descendants.

```typescript
async move(props: {
  fromPath: string;
  toPath: string;
  force?: boolean;
}): Promise<{ ok: true; error: null } | { ok: false; error: string }>
```

**Example:**

```typescript
// Move without force — fails if /archive/old-project exists
const result = await tree.move({
  fromPath: '/projects/old-project',
  toPath: '/archive/old-project',
});

if (!result.ok) {
  console.error(result.error);
}
```

```typescript
// Move with force — replaces destination if it exists
const result = await tree.move({
  fromPath: '/projects/old-project',
  toPath: '/archive/old-project',
  force: true,
});
```

**Error cases:**
- `fromPath` does not exist.
- `toPath` already exists and `force` is not set.
- Moving a folder into one of its own descendants.
- Invalid paths.

---

### `rename({ path, name })`

Renames a node in place. The node stays in the same parent folder, only its name changes. `name` should be just the new filename, not a full path.

```typescript
async rename(props: {
  path: string;
  name: string;
}): Promise<{ ok: true; error: null } | { ok: false; error: string }>
```

**Example:**

```typescript
const result = await tree.rename({
  path: '/docs/draft.txt',
  name: 'final.txt',
});

if (!result.ok) {
  console.error(result.error);
  return;
}

// Node is now at "/docs/final.txt"
```

**Error cases:**
- Path does not exist.
- A node with the new name already exists in the parent.
- Attempt to rename root `"/"`.
- Invalid path.

---

### `list({ path, recursive?, limit?, page?, filter? })`

Lists the children of a folder. Supports pagination and filtering.

```typescript
async list(props: {
  path: string;
  recursive?: boolean;
  limit?: number;
  page?: number;
  filter?: (item: ListItem) => boolean;
}): Promise<
  | { ok: false; error: string }
  | { ok: true; error: null; items: ListItem[] }
>
```

`ListItem` shape:

```typescript
type ListItem = {
  path: string;
  type: 'file' | 'folder';
  createdAt: number;
  updatedAt: number;
};
```

**Example — list top-level children:**

```typescript
const result = await tree.list({ path: '/docs' });

if (!result.ok) {
  console.error(result.error);
  return;
}

for (const item of result.items) {
  console.log(item.path, item.type);
}
```

**Example — list all files recursively, only `.txt` files:**

```typescript
const result = await tree.list({
  path: '/docs',
  recursive: true,
  filter: item => item.type === 'file' && item.path.endsWith('.txt'),
});
```

**Example — paginated list:**

```typescript
const page1 = await tree.list({ path: '/', limit: 20, page: 1 });
const page2 = await tree.list({ path: '/', limit: 20, page: 2 });
```

**Error cases:**
- Path does not exist.
- Path is a file, not a folder.
- Invalid path.

---

### `exists({ path })`

Returns `true` if a node exists at the path, `false` otherwise. Does not distinguish files from folders.

```typescript
async exists(props: { path: string }): Promise<boolean>
```

**Example:**

```typescript
const exists = await tree.exists({ path: '/docs/readme.txt' });
if (!exists) {
  await tree.newFile({ path: '/docs/readme.txt' });
}
```

> `exists()` does not follow the `{ ok, error }` pattern. It returns `false` for invalid paths rather than an error.

---

### `size({ path, recursive?, filter? })`

Returns the total byte size of a node's content. For files, this is the file size. For folders, this is the sum of all file sizes inside (recursively if `recursive: true`).

```typescript
async size(props: {
  path: string;
  recursive?: boolean;
  filter?: (item: ListItem) => boolean;
}): Promise<
  | { ok: false; error: string }
  | { ok: true; error: null; size: number }
>
```

**Example:**

```typescript
const result = await tree.size({ path: '/projects', recursive: true });

if (!result.ok) {
  console.error(result.error);
  return;
}

console.log(`Total size: ${result.size} bytes`);
```

**Error cases:**
- Path does not exist.
- Invalid path.

---

### `write({ path, content })`

Writes content to a file. Accepts a string, `ArrayBuffer`, or a JSON-serializable object. Overwrites existing content. The file must already exist — use `newFile()` first.

```typescript
async write(props: {
  path: string;
  content: string | ArrayBuffer | object;
}): Promise<{ ok: true; error: null } | { ok: false; error: string }>
```

**Example — string content:**

```typescript
const result = await tree.write({
  path: '/docs/readme.txt',
  content: '# My Project\n\nHello world.',
});
```

**Example — JSON object:**

```typescript
const result = await tree.write({
  path: '/config/settings.json',
  content: { theme: 'dark', fontSize: 14 },
});
```

**Example — binary data:**

```typescript
const buffer = await fetch('/logo.png').then(r => r.arrayBuffer());
const result = await tree.write({ path: '/assets/logo.png', content: buffer });
```

**Error cases:**
- Path does not exist (file was never created with `newFile()`).
- Path is a folder.
- Invalid path.

---

### `read({ path })`

Reads the content of a file. Returns both a raw `ArrayBuffer` and a decoded `text` string.

```typescript
async read(props: { path: string }): Promise<
  | { ok: false; error: string }
  | { ok: true; error: null; content: ArrayBuffer; text: string }
>
```

**Example:**

```typescript
const result = await tree.read({ path: '/docs/readme.txt' });

if (!result.ok) {
  console.error(result.error);
  return;
}

console.log(result.text);    // decoded UTF-8 string
console.log(result.content); // raw ArrayBuffer
```

**Error cases:**
- Path does not exist.
- Path is a folder.
- Invalid path.

---

### `subscribe(path, fn)`

Registers a callback that fires whenever anything changes at `path` or anywhere below it. Returns an unsubscribe function.

```typescript
subscribe(path: string, fn: () => void): () => void
```

Subscriptions propagate upward — if you write to `/docs/readme.txt`, callbacks registered on `/docs/readme.txt`, `/docs`, and `/` all fire.

**Example:**

```typescript
const unsubscribe = tree.subscribe('/docs', () => {
  console.log('Something in /docs changed');
});

// Later, when you want to stop listening:
unsubscribe();
```

**Example — always unsubscribe on cleanup:**

```typescript
function watchDocs(tree) {
  const unsubscribe = tree.subscribe('/docs', render);
  render(); // initial render

  window.addEventListener('beforeunload', unsubscribe);
  return unsubscribe;
}
```

> Callbacks are fired synchronously after the mutation. Do not perform heavy synchronous work inside a subscription callback.

---

### `close()`

Closes the IndexedDB connection and removes it from the internal registry. Call this when the filesystem is no longer needed (e.g., on component unmount or page unload).

```typescript
static close(props: { name: string }): void
```

**Example:**

```typescript
window.addEventListener('beforeunload', () => {
  ExplorerTree.close({ name: 'my-app' });
});
```

> The React `useExplorer` hook calls `ExplorerTree.close({ name })` automatically on unmount. You only need to call this manually in vanilla/framework code.

---

## Summary Table

| Method | Returns | Throws |
|---|---|---|
| `ExplorerTree.create(props)` | `ExplorerFolder \| { ok: false }` | Never |
| `source({ path })` | `ExplorerFolder \| ExplorerFile \| { ok: false }` | Never |
| `info({ path })` | `{ ok, path, createdAt, updatedAt }` | Never |
| `type({ path })` | `'file' \| 'folder' \| null` | Never |
| `newFolder({ path })` | `ExplorerFolder \| { ok: false }` | Never |
| `newFile({ path })` | `ExplorerFile \| { ok: false }` | Never |
| `delete({ path })` | `{ ok: true } \| { ok: false }` | Never |
| `copy({ fromPath, toPath, ... })` | `{ ok: true } \| { ok: false }` | Never |
| `move({ fromPath, toPath, ... })` | `{ ok: true } \| { ok: false }` | Never |
| `rename({ path, name })` | `{ ok: true } \| { ok: false }` | Never |
| `list({ path, ... })` | `{ ok, items }` | Never |
| `exists({ path })` | `boolean` | Never |
| `size({ path, ... })` | `{ ok, size }` | Never |
| `write({ path, content })` | `{ ok: true } \| { ok: false }` | Never |
| `read({ path })` | `{ ok, content, text }` | Never |
| `subscribe(path, fn)` | `() => void` (unsubscribe) | Never |
| `close()` | `void` | Never |

---

## Related

- [ExplorerFolder](explorer-folder.md) — folder-scoped façade
- [ExplorerFile](explorer-file.md) — file-scoped façade
- [Error Handling](error-handling.md) — full error pattern reference
- [Events](events.md) — subscribe system in depth
