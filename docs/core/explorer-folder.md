# ExplorerFolder

`ExplorerFolder` is a path-scoped façade over `ExplorerTree`. It holds a reference to the tree and a specific folder path, letting you work with relative `name` arguments instead of constructing full paths manually.

You receive an `ExplorerFolder` from:
- `ExplorerTree.create()` — the root folder at `"/"`
- `tree.newFolder({ path })` — after creating a folder
- `tree.source({ path })` — when the path is a folder
- `folder.newFolder({ name })` — a child folder
- `folder.get({ name })` — any child node that is a folder
- `folder.copy({ to })` — the copied folder

---

## Properties

```typescript
readonly ok: true        // always true — ExplorerFolder is always a success value
readonly error: null     // always null
readonly type: 'folder'  // always "folder"
```

These properties exist so `ExplorerFolder` fits into the same discriminated union as `{ ok: false, error: string }` results. Checking `result.ok` narrows the TypeScript type automatically.

---

## Accessors

### `path`

Returns the normalized path of this folder (no trailing slash).

```typescript
get path(): string
```

```typescript
const docs = await root.newFolder({ name: 'docs' });
if (docs.ok) {
  console.log(docs.path); // "/docs"
}
```

---

### `tree`

Returns the underlying `ExplorerTree` instance. Use this when you need full-path operations or `subscribe`.

```typescript
get tree(): ExplorerTree
```

```typescript
const unsubscribe = docs.tree.subscribe(docs.path, () => {
  console.log('/docs changed');
});
```

---

## Methods

### `info()`

Returns metadata for this folder: path, creation time, and last-updated time.

```typescript
async info(): Promise<
  | { ok: false; error: string }
  | { ok: true; error: null; path: string; createdAt: number; updatedAt: number }
>
```

**Example:**

```typescript
const result = await docs.info();

if (!result.ok) {
  console.error(result.error);
  return;
}

console.log(result.path);      // "/docs"
console.log(result.createdAt); // e.g., 1712345678000
console.log(result.updatedAt); // e.g., 1712345999000
```

---

### `get({ name })`

Returns a child node (file or folder) by name. The returned value is an `ExplorerFolder` or `ExplorerFile`.

```typescript
async get(props: { name: string }): Promise<ExplorerFolder | ExplorerFile | { ok: false; error: string }>
```

**Example:**

```typescript
const child = await docs.get({ name: 'readme.txt' });

if (!child.ok) {
  console.error(child.error); // "path does not exist" or similar
  return;
}

if (child.type === 'file') {
  const read = await child.read();
  if (read.ok) console.log(read.text);
}
```

**Error cases:**
- No child with that name exists in this folder.
- Invalid name (spaces or slashes).

---

### `newFolder({ name })`

Creates a child folder with the given name inside this folder.

```typescript
async newFolder(props: { name: string }): Promise<ExplorerFolder | { ok: false; error: string }>
```

**Example:**

```typescript
const components = await root.newFolder({ name: 'src' });
if (!components.ok) return;

const ui = await components.newFolder({ name: 'components' });
if (!ui.ok) {
  console.error(ui.error);
  return;
}

console.log(ui.path); // "/src/components"
```

**Error cases:**
- A node with that name already exists.
- Invalid name.

---

### `newFile({ name })`

Creates an empty child file with the given name inside this folder.

```typescript
async newFile(props: { name: string }): Promise<ExplorerFile | { ok: false; error: string }>
```

**Example:**

```typescript
const file = await docs.newFile({ name: 'index.md' });

if (!file.ok) {
  console.error(file.error);
  return;
}

await file.write({ content: '# Index\n' });
console.log(file.path); // "/docs/index.md"
```

**Error cases:**
- A node with that name already exists.
- Invalid name.

---

### `rename({ name })`

Renames this folder in place. The folder stays in its current parent — only the last segment of the path changes.

```typescript
async rename(props: { name: string }): Promise<{ ok: true; error: null } | { ok: false; error: string }>
```

**Example:**

```typescript
// folder.path is "/projects/draft"
const result = await folder.rename({ name: 'final' });

if (!result.ok) {
  console.error(result.error);
  return;
}

// folder.path is now "/projects/final" — the instance updates itself after rename
```

**Error cases:**
- A node with the new name already exists in the parent.
- Attempt to rename root `"/"`.

---

### `copy({ to, merge?, priority? })`

Copies this folder and all its contents to a new path. Returns a new `ExplorerFolder` pointing to the copy.

```typescript
async copy(props: {
  to: string;
  merge?: boolean;
  priority?: 'source' | 'destination';
}): Promise<ExplorerFolder | { ok: false; error: string }>
```

- `to` — full destination path.
- `merge` — if `true`, merges source into destination when destination already exists.
- `priority` — when both source and destination have a node at the same sub-path and `merge` is `true`:
  - `'source'` — source overwrites destination.
  - `'destination'` — destination content is kept.

**Example — simple copy:**

```typescript
const copy = await srcFolder.copy({ to: '/backup/src' });

if (!copy.ok) {
  console.error(copy.error); // e.g., "destination already exists"
  return;
}

console.log(copy.path); // "/backup/src"
```

**Example — merge with source priority:**

```typescript
const result = await updatesFolder.copy({
  to: '/projects/my-app',
  merge: true,
  priority: 'source',
});
```

**Error cases:**
- Destination exists and `merge` is not set.
- Source and destination are the same path.
- Invalid destination path.

---

### `move({ to, force? })`

Moves this folder to a new path.

```typescript
async move(props: {
  to: string;
  force?: boolean;
}): Promise<{ ok: true; error: null } | { ok: false; error: string }>
```

- `to` — full destination path.
- `force` — if `true`, deletes the existing node at `to` before moving.

Cannot move a folder into one of its own descendants.

**Example:**

```typescript
const result = await projectFolder.move({ to: '/archive/my-project' });

if (!result.ok) {
  console.error(result.error);
}
```

**Example with force:**

```typescript
const result = await projectFolder.move({
  to: '/archive/my-project',
  force: true,
});
```

**Error cases:**
- Destination exists and `force` is not set.
- Moving a folder into one of its own descendants.
- Invalid destination path.

---

### `delete()`

Deletes this folder and all its contents recursively.

```typescript
async delete(): Promise<{ ok: true; error: null } | { ok: false; error: string }>
```

**Example:**

```typescript
const result = await tempFolder.delete();

if (!result.ok) {
  console.error(result.error);
}
```

**Error cases:**
- This folder no longer exists (was already deleted).
- Attempt to delete root `"/"`.

---

### `list(options?)`

Lists the contents of this folder. Without options, returns direct children only.

```typescript
async list(options?: {
  recursive?: boolean;
  limit?: number;
  page?: number;
  filter?: (item: ListItem) => boolean;
}): Promise<
  | { ok: false; error: string }
  | { ok: true; error: null; items: ListItem[] }
>
```

`ListItem`:

```typescript
type ListItem = {
  path: string;
  type: 'file' | 'folder';
  createdAt: number;
  updatedAt: number;
};
```

**Example — direct children:**

```typescript
const result = await docs.list();

if (!result.ok) {
  console.error(result.error);
  return;
}

result.items.forEach(item => {
  console.log(item.path, item.type);
});
```

**Example — all files recursively:**

```typescript
const result = await docs.list({
  recursive: true,
  filter: item => item.type === 'file',
});
```

**Example — paginated:**

```typescript
const page1 = await docs.list({ limit: 10, page: 1 });
const page2 = await docs.list({ limit: 10, page: 2 });
```

---

### `exists()`

Returns `true` if this folder still exists in the filesystem.

```typescript
async exists(): Promise<boolean>
```

**Example:**

```typescript
const stillExists = await folder.exists();
if (!stillExists) {
  console.log('Folder was deleted externally');
}
```

---

### `size(options?)`

Returns the total size in bytes of all files inside this folder. Use `recursive: true` to include all descendants.

```typescript
async size(options?: {
  recursive?: boolean;
  filter?: (item: ListItem) => boolean;
}): Promise<
  | { ok: false; error: string }
  | { ok: true; error: null; size: number }
>
```

**Example:**

```typescript
const result = await projectFolder.size({ recursive: true });

if (!result.ok) {
  console.error(result.error);
  return;
}

console.log(`Project size: ${result.size} bytes`);
```

---

## Summary Table

| Method / Property | Returns | Notes |
|---|---|---|
| `ok` | `true` | Constant |
| `error` | `null` | Constant |
| `type` | `'folder'` | Constant |
| `path` | `string` | Getter |
| `tree` | `ExplorerTree` | Getter |
| `info()` | `{ ok, path, createdAt, updatedAt }` | — |
| `get({ name })` | `ExplorerFolder \| ExplorerFile \| { ok: false }` | — |
| `newFolder({ name })` | `ExplorerFolder \| { ok: false }` | — |
| `newFile({ name })` | `ExplorerFile \| { ok: false }` | — |
| `rename({ name })` | `{ ok: true } \| { ok: false }` | Instance path not updated |
| `copy({ to, ... })` | `ExplorerFolder \| { ok: false }` | Returns new folder |
| `move({ to, ... })` | `{ ok: true } \| { ok: false }` | — |
| `delete()` | `{ ok: true } \| { ok: false }` | Recursive |
| `list(options?)` | `{ ok, items }` | Pagination + filter |
| `exists()` | `boolean` | — |
| `size(options?)` | `{ ok, size }` | Bytes |

---

## Related

- [ExplorerTree](explorer-tree.md) — full-path API
- [ExplorerFile](explorer-file.md) — file operations
- [Error Handling](error-handling.md) — error pattern reference
