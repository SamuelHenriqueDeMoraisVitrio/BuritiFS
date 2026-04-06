# Event System

BuritiFS includes a lightweight reactive subscription system built on top of `ExplorerTree`. It lets you observe changes to any path in the filesystem without polling, and it works in any JavaScript environment — no React required.

---

## How It Works

Internally, the tree maintains a `Map<string, Set<() => void>>`. Each key is a path string; each value is a set of callback functions registered for that path.

```
subscribers = Map {
  "/"          → Set { fn1, fn2 },
  "/docs"      → Set { fn3 },
  "/docs/notes" → Set { fn4 },
}
```

After every successful mutation (create, delete, write, move, rename, copy), the tree calls an internal `notify(affectedPath)`. This function:

1. Fires all callbacks registered for `affectedPath`.
2. Computes the parent path.
3. Fires all callbacks registered for the parent.
4. Continues up the tree until it reaches and fires callbacks for `"/"`.

So a write to `/docs/notes/todo.txt` fires callbacks registered on:
- `/docs/notes/todo.txt`
- `/docs/notes`
- `/docs`
- `/`

This means you never need to manually re-subscribe when navigating directories — subscribing to an ancestor catches everything below it automatically.

> **Important:** `notify` is internal to the library. Never call it directly. Use `subscribe` and trigger mutations through the public API.

---

## The `subscribe` API

```typescript
subscribe(path: string, fn: () => void): () => void
```

- `path` — the path to watch. Receives events for anything at or below this path.
- `fn` — called with no arguments after a mutation.
- Returns an **unsubscribe function**. Always call it during cleanup to prevent memory leaks.

**When events fire:**
- `newFolder()` — fires on the new folder's parent.
- `newFile()` — fires on the new file's parent.
- `delete()` — fires on the deleted node's parent.
- `write()` — fires on the written file's path (propagates to parents).
- `rename()` — fires on the renamed node's parent.
- `move()` — fires on both the old parent and the new parent.
- `copy()` — fires on the destination's parent.

---

## Vanilla JavaScript Example

A reactive file list without any framework:

```typescript
import { ExplorerTree } from 'buritifs';

async function main() {
  const result = await ExplorerTree.create({ name: 'my-app' });
  if (!result.ok) return;

  const root = result;
  const tree = root.tree;
  const listEl = document.getElementById('file-list');

  async function renderList() {
    const list = await tree.list({ path: '/docs' });
    if (!list.ok) return;

    listEl.innerHTML = list.items
      .map(item => `<li>${item.path} (${item.type})</li>`)
      .join('');
  }

  // Initial render
  await renderList();

  // Subscribe — re-render whenever /docs changes
  const unsubscribe = tree.subscribe('/docs', renderList);

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    unsubscribe();
    tree.close();
  });
}

main();
```

Any call to `newFile`, `delete`, `rename`, etc. under `/docs` will automatically trigger `renderList`.

---

## Vue 3 Example

Using `ref` and the Composition API:

```typescript
// composables/useFileList.ts
import { ref, onMounted, onUnmounted } from 'vue';
import type { ExplorerTree, ListItem } from 'buritifs';

export function useFileList(tree: ExplorerTree, path: string) {
  const items = ref<ListItem[]>([]);
  const loading = ref(true);
  const error = ref<string | null>(null);
  let unsubscribe: (() => void) | null = null;

  async function load() {
    loading.value = true;
    const result = await tree.list({ path });

    if (!result.ok) {
      error.value = result.error;
    } else {
      items.value = result.items;
      error.value = null;
    }

    loading.value = false;
  }

  onMounted(() => {
    load();
    unsubscribe = tree.subscribe(path, load);
  });

  onUnmounted(() => {
    unsubscribe?.();
  });

  return { items, loading, error };
}
```

```vue
<!-- FileList.vue -->
<script setup lang="ts">
import { useFileList } from './composables/useFileList';

const props = defineProps<{ tree: ExplorerTree; path: string }>();
const { items, loading, error } = useFileList(props.tree, props.path);
</script>

<template>
  <p v-if="loading">Loading...</p>
  <p v-else-if="error">{{ error }}</p>
  <ul v-else>
    <li v-for="item in items" :key="item.path">
      {{ item.path }} ({{ item.type }})
    </li>
  </ul>
</template>
```

---

## Svelte Example

Using `onMount` and `onDestroy`:

```svelte
<!-- FileList.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { ExplorerTree, ListItem } from 'buritifs';

  export let tree: ExplorerTree;
  export let path: string;

  let items: ListItem[] = [];
  let loading = true;
  let error: string | null = null;
  let unsubscribe: (() => void) | null = null;

  async function load() {
    loading = true;
    const result = await tree.list({ path });

    if (!result.ok) {
      error = result.error;
    } else {
      items = result.items;
      error = null;
    }

    loading = false;
  }

  onMount(() => {
    load();
    unsubscribe = tree.subscribe(path, load);
  });

  onDestroy(() => {
    unsubscribe?.();
  });
</script>

{#if loading}
  <p>Loading...</p>
{:else if error}
  <p>{error}</p>
{:else}
  <ul>
    {#each items as item (item.path)}
      <li>{item.path} ({item.type})</li>
    {/each}
  </ul>
{/if}
```

---

## Subscribing to Multiple Paths

You can have as many subscriptions as you need. Each `subscribe()` call returns its own unsubscribe function:

```typescript
const unsubDocs = tree.subscribe('/docs', () => loadDocs());
const unsubAssets = tree.subscribe('/assets', () => loadAssets());
const unsubRoot = tree.subscribe('/', () => updateStatusBar());

// Cleanup
function cleanup() {
  unsubDocs();
  unsubAssets();
  unsubRoot();
  tree.close();
}
```

---

## Memory Leak Warning

Always store the return value of `subscribe` and call it during cleanup. If you forget, the callback remains registered for the entire lifetime of the database connection, potentially holding references to destroyed DOM elements or unmounted components:

```typescript
// Bad — no cleanup
tree.subscribe('/docs', () => updateUI());

// Good — cleanup on unmount/unload
const unsub = tree.subscribe('/docs', () => updateUI());
onDestroy(() => unsub());
```

---

## Callback Timing

Callbacks are called synchronously after a mutation completes. This means:

- By the time your callback fires, the new state is already in both IDB and OPFS.
- You can immediately `list()` or `read()` from inside the callback and get the updated data.
- Do not perform heavy synchronous work inside a callback — prefer async reads that yield to the browser.
