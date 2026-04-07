# ExplorerFile

`ExplorerFile` is a path-scoped façade over `ExplorerTree`. It holds a reference to the tree and a specific file path, delegating all operations to the tree so you don't need to manage path strings manually.

You receive an `ExplorerFile` from:
- `tree.newFile({ path })` — after creating a file
- `tree.source({ path })` — when the path is a file
- `folder.newFile({ name })` — a child file
- `folder.get({ name })` — a child node that is a file
- `file.copy({ to })` — the copied file

---

## Properties

```typescript
readonly ok: true       // always true — ExplorerFile is always a success value
readonly error: null    // always null
readonly type: 'file'   // always "file"
```

These constants allow `ExplorerFile` to participate in the same discriminated union as error results. Checking `result.ok` narrows the TypeScript type automatically.

---

## Accessors

### `path`

Returns the normalized path of this file.

```typescript
get path(): string
```

```typescript
const file = await docs.newFile({ name: 'notes.txt' });
if (file.ok) {
  console.log(file.path); // "/docs/notes.txt"
}
```

---

## Methods

### `info()`

Returns metadata for this file: path, creation timestamp, and last-updated timestamp.

```typescript
async info(): Promise<
  | { ok: false; error: string }
  | { ok: true; error: null; path: string; createdAt: number; updatedAt: number }
>
```

**Example:**

```typescript
const result = await file.info();

if (!result.ok) {
  console.error(result.error);
  return;
}

console.log(result.path);      // "/docs/notes.txt"
console.log(result.createdAt); // Unix timestamp in ms
console.log(result.updatedAt); // Unix timestamp in ms
```

---

### `rename({ name })`

Renames this file in place. The file stays in its current parent folder — only the last segment of the path changes.

```typescript
async rename(props: { name: string }): Promise<{ ok: true; error: null } | { ok: false; error: string }>
```

**Example:**

```typescript
// file.path is "/docs/draft.txt"
const result = await file.rename({ name: 'final.txt' });

if (!result.ok) {
  console.error(result.error);
  return;
}

// The file now lives at "/docs/final.txt"
// file.path is now "/docs/final.txt" — the instance updates itself after rename
```

**Error cases:**
- A file with the new name already exists in the same parent folder.
- Invalid name (spaces, slashes).

---

### `copy({ to, priority? })`

Copies this file to a new path. Returns a new `ExplorerFile` pointing to the copy.

```typescript
async copy(props: {
  to: string;
  priority?: 'source' | 'destination';
}): Promise<ExplorerFile | { ok: false; error: string }>
```

- `to` — full destination path, including the new file name.
- `priority` — when a file already exists at `to`:
  - `'source'` — overwrites the destination with this file's content.
  - `'destination'` — keeps the existing file, operation is a no-op.
  - Omitting `priority` when the destination exists causes an error.

**Example — copy to a new path:**

```typescript
const copy = await file.copy({ to: '/backup/notes.txt' });

if (!copy.ok) {
  console.error(copy.error); // e.g., "destination already exists"
  return;
}

console.log(copy.path); // "/backup/notes.txt"
```

**Example — overwrite if destination exists:**

```typescript
const copy = await file.copy({
  to: '/backup/notes.txt',
  priority: 'source',
});

if (!copy.ok) {
  console.error(copy.error);
  return;
}
```

**Example — keep destination if it exists:**

```typescript
const copy = await file.copy({
  to: '/backup/notes.txt',
  priority: 'destination',
});
```

**Error cases:**
- Destination exists and `priority` is not specified.
- `to` is the same path as the current file.
- Invalid destination path.

---

### `move({ to, force? })`

Moves this file to a new path.

```typescript
async move(props: {
  to: string;
  force?: boolean;
}): Promise<{ ok: true; error: null } | { ok: false; error: string }>
```

- `to` — full destination path, including the file name.
- `force` — if `true`, deletes the existing file at `to` before moving.

**Example:**

```typescript
// Move file to a different folder
const result = await file.move({ to: '/archive/notes.txt' });

if (!result.ok) {
  console.error(result.error); // e.g., "destination already exists"
}
```

**Example — force move:**

```typescript
const result = await file.move({
  to: '/archive/notes.txt',
  force: true,
});
```

**Error cases:**
- Destination exists and `force` is not set.
- Invalid destination path.

---

### `delete()`

Deletes this file from the filesystem. Removes both the OPFS content and the IndexedDB metadata record.

```typescript
async delete(): Promise<{ ok: true; error: null } | { ok: false; error: string }>
```

**Example:**

```typescript
const result = await file.delete();

if (!result.ok) {
  console.error(result.error);
}
```

**Error cases:**
- The file no longer exists (was already deleted).

---

### `exists()`

Returns `true` if this file still exists in the filesystem.

```typescript
async exists(): Promise<boolean>
```

**Example:**

```typescript
const still = await file.exists();
if (!still) {
  console.log('File was deleted');
}
```

---

### `write({ content })`

Writes content to this file. Accepts a string, `ArrayBuffer`, or a JSON-serializable object. Overwrites existing content.

```typescript
async write(props: {
  content: string | ArrayBuffer | object;
}): Promise<{ ok: true; error: null } | { ok: false; error: string }>
```

**Example — string:**

```typescript
const result = await file.write({ content: '# Hello\n\nWorld.' });

if (!result.ok) {
  console.error(result.error);
}
```

**Example — JSON object (automatically serialized):**

```typescript
const result = await file.write({
  content: { version: 1, data: [1, 2, 3] },
});
```

**Example — binary ArrayBuffer:**

```typescript
const response = await fetch('https://example.com/image.png');
const buffer = await response.arrayBuffer();

const result = await file.write({ content: buffer });
```

**Error cases:**
- The file was deleted before writing.
- Invalid content type.

---

### `read()`

Reads the content of this file. Returns both the raw `ArrayBuffer` and a decoded UTF-8 `text` string.

```typescript
async read(): Promise<
  | { ok: false; error: string }
  | { ok: true; error: null; content: ArrayBuffer; text: string }
>
```

**Example:**

```typescript
const result = await file.read();

if (!result.ok) {
  console.error(result.error);
  return;
}

console.log(result.text);    // UTF-8 decoded string
console.log(result.content); // raw ArrayBuffer for binary processing
```

**Example — parse JSON file:**

```typescript
const result = await configFile.read();

if (!result.ok) {
  console.error(result.error);
  return;
}

const config = JSON.parse(result.text);
console.log(config.version);
```

**Error cases:**
- The file was deleted.
- OPFS content is missing (broken state — normally cleaned up by recovery on next init).

---

## Summary Table

| Method / Property | Returns | Notes |
|---|---|---|
| `ok` | `true` | Constant |
| `error` | `null` | Constant |
| `type` | `'file'` | Constant |
| `path` | `string` | Getter |
| `info()` | `{ ok, path, createdAt, updatedAt }` | — |
| `rename({ name })` | `{ ok: true } \| { ok: false }` | Instance path not updated |
| `copy({ to, priority? })` | `ExplorerFile \| { ok: false }` | Returns new file |
| `move({ to, force? })` | `{ ok: true } \| { ok: false }` | — |
| `delete()` | `{ ok: true } \| { ok: false }` | — |
| `exists()` | `boolean` | — |
| `write({ content })` | `{ ok: true } \| { ok: false }` | String, ArrayBuffer, or object |
| `read()` | `{ ok, content, text }` | Both binary and UTF-8 |

---

## Related

- [ExplorerTree](explorer-tree.md) — full-path API and `source()`
- [ExplorerFolder](explorer-folder.md) — folder operations
- [Error Handling](error-handling.md) — error pattern reference
