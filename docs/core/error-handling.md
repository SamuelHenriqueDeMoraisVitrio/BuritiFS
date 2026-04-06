# Error Handling

BuritiFS never throws exceptions from public API methods. Every async operation returns a plain object you can inspect safely. This page explains the pattern, how TypeScript narrows types around it, and what errors each kind of operation can produce.

---

## The `{ ok, error }` Pattern

Every async method returns one of two shapes:

```typescript
// Success
{ ok: true;  error: null;   ...additionalFields }

// Failure
{ ok: false; error: string }
```

The `ok` field is a boolean discriminant. When `ok` is `true`, `error` is always `null` and any additional fields (like `items`, `content`, `size`) are present. When `ok` is `false`, `error` is a human-readable string explaining what went wrong, and no additional fields are present.

---

## Why the Library Never Throws

Unhandled promise rejections in browser code silently disappear in production unless you have global error handlers. By returning errors as values, BuritiFS makes every failure path visible at the call site. You are forced to acknowledge that an operation can fail — the TypeScript type system will not let you access `result.items` without first checking `result.ok`.

This pattern is especially useful in event handlers and React hooks, where swallowing exceptions is easy to do accidentally.

---

## TypeScript Narrowing

TypeScript narrows the type automatically when you branch on `result.ok`:

```typescript
const result = await tree.list({ path: '/docs' });

// result.items is not accessible here — TypeScript doesn't know which union member this is

if (!result.ok) {
  // result is narrowed to { ok: false; error: string }
  console.error(result.error); // string
  return;
}

// result is narrowed to { ok: true; error: null; items: ListItem[] }
result.items.forEach(item => console.log(item.path));
```

The same applies to `ExplorerFolder` and `ExplorerFile` results:

```typescript
const file = await tree.newFile({ path: '/docs/readme.txt' });

if (!file.ok) {
  // file is { ok: false; error: string }
  return;
}

// file is ExplorerFile — file.ok is true, file.error is null, file.path is available
await file.write({ content: 'Hello' });
```

---

## Common Error Patterns

### Checking a single operation

```typescript
const result = await folder.delete();

if (!result.ok) {
  showToast(`Could not delete: ${result.error}`);
  return;
}

// Deletion succeeded
```

### Chaining operations

```typescript
async function createReadme(root: ExplorerFolder): Promise<string | null> {
  const docs = await root.newFolder({ name: 'docs' });
  if (!docs.ok) return docs.error;

  const file = await docs.newFile({ name: 'readme.txt' });
  if (!file.ok) return file.error;

  const write = await file.write({ content: '# Docs\n' });
  if (!write.ok) return write.error;

  return null; // success, no error
}
```

### Displaying errors in UI

```typescript
const [error, setError] = useState<string | null>(null);

async function handleCreate() {
  const result = await root.newFile({ name: 'untitled.txt' });

  if (!result.ok) {
    setError(result.error);
    return;
  }

  setError(null);
  // proceed...
}
```

---

## Methods That Do Not Follow This Pattern

Two methods return plain primitives instead of `{ ok, error }`:

### `exists({ path })`

Returns `boolean`. Returns `false` for invalid paths instead of an error:

```typescript
const found = await tree.exists({ path: '/docs' });
// true or false — never throws
```

### `type({ path })`

Returns `'file' | 'folder' | null`. Returns `null` for paths that don't exist:

```typescript
const kind = await tree.type({ path: '/docs' });
// "folder", "file", or null
```

For richer error information on these cases, use `info()` instead.

---

## Common Error Messages

The exact strings are internal and may change between versions. Do not parse error strings for logic — use them for display only. Here are examples of the situations that produce errors:

| Situation | Example error |
|---|---|
| Path does not exist | `"path does not exist"` |
| Parent folder does not exist | `"parent does not exist"` |
| Node already exists at path | `"path already exists"` |
| Destination exists and no merge/force | `"destination already exists"` |
| Moving folder into its own descendant | `"cannot move a folder into itself"` |
| Attempting to delete root `"/"` | `"cannot delete root"` |
| Attempting to rename root `"/"` | `"cannot rename root"` |
| Path contains spaces | `"path contains invalid characters"` |
| Path contains double slashes | `"path contains invalid characters"` |
| OPFS or IndexedDB not supported | `"storage not supported"` |

---

## Propagating Errors Without Exceptions

Since errors are plain values, you can propagate them naturally:

```typescript
async function setup(name: string) {
  const root = await ExplorerTree.create({ name });
  if (!root.ok) return root; // propagate { ok: false, error }

  const src = await root.newFolder({ name: 'src' });
  if (!src.ok) return src;  // propagate

  return src; // ExplorerFolder — propagate success
}

// Call site:
const result = await setup('my-app');
if (!result.ok) {
  console.error(result.error);
} else {
  console.log(result.path); // "/src"
}
```

---

## Using with `useAction` in React

The `useAction` hook in the React integration reads `result.ok` and `result.error` automatically:

```tsx
const createFile = useAction(() =>
  root.newFile({ name: 'draft.txt' })
);

// createFile.error is automatically set to result.error when ok is false
// createFile.loading is true while the operation is pending
```

See [useAction](../react/use-action.md) for full documentation.
