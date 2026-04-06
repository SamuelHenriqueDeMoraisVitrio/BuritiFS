# useAction

`useAction` wraps any async filesystem operation with `loading` and `error` state. It prevents concurrent executions, checks that the component is still mounted before updating state, and gives you a `reset` function to clear errors.

---

## Import

```typescript
import { useAction } from 'buritifs/react';
```

---

## Signature

```typescript
function useAction<T>(
  fn: () => Promise<{ ok: boolean; error: string | null } & T>
): {
  run: () => Promise<void>;
  loading: boolean;
  error: string | null;
  reset: () => void;
}
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `fn` | `() => Promise<{ ok: boolean; error: string \| null }>` | The async operation to run. Must return a `{ ok, error }` shaped result (any BuritiFS method qualifies). |

### Return value

| Field | Type | Description |
|---|---|---|
| `run` | `() => Promise<void>` | Triggers the operation. Ignored if already loading. |
| `loading` | `boolean` | `true` while the operation is in progress. |
| `error` | `string \| null` | Error message from the last failed run; `null` if the last run succeeded. |
| `reset` | `() => void` | Clears `error` and sets `loading` to `false`. |

---

## Example — Basic Usage

```tsx
import { useAction } from 'buritifs/react';
import type { ExplorerFolder } from 'buritifs';

function CreateFileButton({ folder }: { folder: ExplorerFolder }) {
  const createFile = useAction(() =>
    folder.newFile({ name: `untitled-${Date.now()}.txt` })
  );

  return (
    <button onClick={createFile.run} disabled={createFile.loading}>
      {createFile.loading ? 'Creating...' : 'New File'}
    </button>
  );
}
```

When `run()` is called:
1. `loading` becomes `true`.
2. `fn()` is awaited.
3. If `result.ok` is `false`, `error` is set to `result.error`.
4. `loading` returns to `false`.

---

## Example — With Error Feedback and Reset

```tsx
function CreateFolder({ root }: { root: ExplorerFolder }) {
  const [name, setName] = useState('');

  const create = useAction(() => root.newFolder({ name }));

  return (
    <div>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Folder name"
      />

      <button onClick={create.run} disabled={create.loading || !name}>
        {create.loading ? 'Creating...' : 'Create Folder'}
      </button>

      {create.error && (
        <div style={{ color: 'red' }}>
          <span>{create.error}</span>
          <button onClick={create.reset}>Dismiss</button>
        </div>
      )}
    </div>
  );
}
```

---

## Example — Delete with Confirmation

```tsx
function DeleteButton({ file }: { file: ExplorerFile }) {
  const deleteFile = useAction(() => file.delete());

  function handleClick() {
    if (confirm(`Delete ${file.path}?`)) {
      deleteFile.run();
    }
  }

  return (
    <>
      <button onClick={handleClick} disabled={deleteFile.loading}>
        {deleteFile.loading ? 'Deleting...' : 'Delete'}
      </button>
      {deleteFile.error && <span style={{ color: 'red' }}>{deleteFile.error}</span>}
    </>
  );
}
```

---

## Example — Rename

```tsx
function RenameInput({ file }: { file: ExplorerFile }) {
  const [newName, setNewName] = useState(file.path.split('/').at(-1) ?? '');

  const rename = useAction(() => file.rename({ name: newName }));

  return (
    <div>
      <input
        value={newName}
        onChange={e => setNewName(e.target.value)}
      />
      <button onClick={rename.run} disabled={rename.loading}>
        Rename
      </button>
      {rename.error && <span>{rename.error}</span>}
    </div>
  );
}
```

---

## Example — Move

```tsx
function MoveToArchive({ file, root }: { file: ExplorerFile; root: ExplorerFolder }) {
  const move = useAction(() =>
    file.move({ to: `/archive/${file.path.split('/').at(-1)}` })
  );

  return (
    <button onClick={move.run} disabled={move.loading}>
      {move.loading ? 'Moving...' : 'Move to Archive'}
    </button>
  );
}
```

---

## Example — Write Content

```tsx
function SaveButton({ file, content }: { file: ExplorerFile; content: string }) {
  const save = useAction(() => file.write({ content }));

  return (
    <div>
      <button onClick={save.run} disabled={save.loading}>
        {save.loading ? 'Saving...' : 'Save'}
      </button>
      {save.error && <span style={{ color: 'red' }}>Save failed: {save.error}</span>}
    </div>
  );
}
```

---

## Concurrent Call Prevention

If `run()` is called while `loading` is already `true`, the new call is silently ignored. The operation is not queued — only one invocation runs at a time:

```typescript
const create = useAction(() => root.newFile({ name: 'x.txt' }));

// If the user clicks the button twice quickly:
create.run(); // starts the operation, loading = true
create.run(); // ignored because loading is already true
```

This means you can safely pass `run` directly as an `onClick` handler without debouncing.

---

## The `reset` Function

`reset()` clears `error` and resets `loading` to `false`. Use it to let the user dismiss an error and try again:

```tsx
{create.error && (
  <div>
    <p>Error: {create.error}</p>
    <button onClick={create.reset}>Try again</button>
  </div>
)}
```

`reset()` does not undo the filesystem operation — it only clears the hook's state.

---

## Mounted Check

`useAction` checks whether the component is still mounted before calling `setState`. If the component unmounts while an operation is in progress, state updates are skipped. This prevents the "Can't perform a React state update on an unmounted component" warning.

---

## Using with `useFolder`

`useAction` and `useFolder` are designed to work together. When an action completes successfully, the filesystem's event system fires, and any active `useFolder` subscriptions automatically reload:

```tsx
function FolderManager({ folder }: { folder: ExplorerFolder }) {
  const { items, loading } = useFolder(folder);

  // When this runs, useFolder re-renders automatically — no extra code needed
  const createFile = useAction(() =>
    folder.newFile({ name: `file-${Date.now()}.txt` })
  );

  return (
    <div>
      <button onClick={createFile.run}>New File</button>
      <ul>
        {items.map(item => <li key={item.path}>{item.path}</li>)}
      </ul>
    </div>
  );
}
```

---

## Related

- [useExplorer](use-explorer.md) — opens the filesystem
- [useFolder](use-folder.md) — observes folder contents
- [Error Handling](../core/error-handling.md) — the `{ ok, error }` pattern
