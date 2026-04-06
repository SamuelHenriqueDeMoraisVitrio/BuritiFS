# Getting Started

This guide walks you through installing BuritiFS and writing your first filesystem operations in both vanilla TypeScript and React.

---

## Prerequisites

- A modern browser with **OPFS** and **IndexedDB** support (Chrome 86+, Edge 86+, Safari 15.2+).
- **Node.js 18+** for local development and builds.
- TypeScript 5+ (recommended, not required).

See [Browser Support](../guides/browser-support.md) for the full compatibility matrix.

---

## Installation

```bash
npm install buritifs
```

```bash
pnpm add buritifs
```

If you use React hooks, no extra package is needed — the hooks live inside the same package at `buritifs/react`:

```typescript
import { useExplorer, useFolder, useAction } from 'buritifs/react';
```

---

## Minimum Working Example — Vanilla TypeScript

This example opens a named filesystem, creates a directory, creates a file inside it, writes content, and reads it back.

```typescript
import { ExplorerTree } from 'buritifs';

async function main() {
  // Open (or create) a named filesystem.
  // Each unique name maps to a separate IndexedDB database.
  const result = await ExplorerTree.create({ name: 'my-app' });

  if (!result.ok) {
    console.error('Could not open filesystem:', result.error);
    return;
  }

  // result is an ExplorerFolder pointing to the root "/"
  const root = result;

  // Create a folder
  const docs = await root.newFolder({ name: 'docs' });
  if (!docs.ok) {
    console.error('Could not create folder:', docs.error);
    return;
  }

  // Create a file inside the folder
  const readme = await docs.newFile({ name: 'readme.txt' });
  if (!readme.ok) {
    console.error('Could not create file:', readme.error);
    return;
  }

  // Write content (string, ArrayBuffer, or JSON-serializable object)
  const writeResult = await readme.write({ content: 'Hello, BuritiFS!' });
  if (!writeResult.ok) {
    console.error('Write failed:', writeResult.error);
    return;
  }

  // Read the content back
  const readResult = await readme.read();
  if (!readResult.ok) {
    console.error('Read failed:', readResult.error);
    return;
  }

  console.log(readResult.text);    // "Hello, BuritiFS!"
  console.log(readResult.content); // ArrayBuffer

  // Close the database when you're done (e.g., on page unload)
  root.tree.close();
}

main();
```

---

## Minimum Working Example — React

This example shows the three React hooks working together: `useExplorer` opens the filesystem, `useFolder` lists a folder's contents reactively, and `useAction` wraps a mutation with loading/error state.

```tsx
import { useExplorer, useFolder, useAction } from 'buritifs/react';

// App.tsx — mount useExplorer once near the root of your app
export function App() {
  const explorer = useExplorer('my-app');

  if (explorer.status === 'loading') {
    return <p>Opening filesystem...</p>;
  }

  if (explorer.status === 'error') {
    return <p>Failed to open filesystem: {explorer.error}</p>;
  }

  // explorer.status === 'ready'
  return <FileManager root={explorer.root} />;
}

// FileManager.tsx — list files and create new ones
function FileManager({ root }) {
  const { items, loading, error } = useFolder(root);

  const createFile = useAction(() =>
    root.newFile({ name: `untitled-${Date.now()}.txt` })
  );

  if (loading) return <p>Loading files...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <button onClick={createFile.run} disabled={createFile.loading}>
        {createFile.loading ? 'Creating...' : 'New File'}
      </button>

      {createFile.error && (
        <p style={{ color: 'red' }}>
          {createFile.error}
          <button onClick={createFile.reset}>Dismiss</button>
        </p>
      )}

      <ul>
        {items.map(item => (
          <li key={item.path}>
            {item.type === 'folder' ? '📁' : '📄'} {item.path}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

When `createFile.run()` succeeds, `useFolder` automatically re-renders because `useAction` triggers the filesystem's event system. No manual state updates needed.

---

## Understanding the `{ ok, error }` Return Pattern

Every async method in BuritiFS returns a discriminated union — never throws:

```typescript
// Success
{ ok: true,  error: null,   ...additionalData }

// Failure
{ ok: false, error: "human-readable message" }
```

Check `result.ok` before accessing any additional fields:

```typescript
const result = await root.newFile({ name: 'notes.txt' });

if (!result.ok) {
  // TypeScript knows result.error is a string here
  console.error(result.error);
  return;
}

// TypeScript knows result is an ExplorerFile here
await result.write({ content: 'First note' });
```

This pattern means:
- No unhandled promise rejections.
- TypeScript narrows the type automatically — no casting needed.
- You can propagate errors explicitly without wrapping every call in try/catch.

---

## Next Steps

- **[Core API — ExplorerTree](core/explorer-tree.md)** — full reference for all filesystem methods.
- **[Core API — ExplorerFolder](core/explorer-folder.md)** — folder-scoped methods.
- **[Core API — ExplorerFile](core/explorer-file.md)** — file-scoped methods.
- **[React Hooks Overview](react/overview.md)** — how the three hooks relate to each other.
- **[Using without React](guides/without-react.md)** — integration examples for Vue, Svelte, and vanilla JS.
- **[Architecture Overview](core/overview.md)** — how BuritiFS is built internally.
