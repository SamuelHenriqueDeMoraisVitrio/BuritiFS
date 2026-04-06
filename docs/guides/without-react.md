# Using BuritiFS Without React

BuritiFS core has no framework dependency. The `subscribe` system works in any JavaScript environment. This guide shows how to integrate BuritiFS reactively in vanilla JS, Vue 3, Svelte, and Angular.

---

## Key Pattern: Store the Unsubscribe Function

Every call to `tree.subscribe(path, fn)` returns an unsubscribe function. **Always store it and call it during cleanup.** Failing to unsubscribe causes memory leaks and callbacks that fire after the component/page that registered them is gone.

```typescript
// Good
const unsubscribe = tree.subscribe('/docs', handleChange);
// ... later, on cleanup:
unsubscribe();

// Bad — no cleanup reference
tree.subscribe('/docs', handleChange);
```

---

## Vanilla JavaScript

A complete example of a reactive file list with no framework:

```typescript
import { ExplorerTree } from 'buritifs';

async function main() {
  const result = await ExplorerTree.create({ name: 'my-app' });
  if (!result.ok) {
    document.body.innerHTML = `<p>Error: ${result.error}</p>`;
    return;
  }

  const root = result;
  const tree = root.tree;

  // DOM references
  const listEl = document.getElementById('file-list')!;
  const createBtn = document.getElementById('create-btn')!;
  const errorEl = document.getElementById('error')!;

  // Render function — called on initial load and after each change
  async function render() {
    const list = await tree.list({ path: '/' });
    if (!list.ok) {
      errorEl.textContent = list.error;
      return;
    }

    listEl.innerHTML = list.items
      .map(item => `<li data-path="${item.path}">${item.path} (${item.type})</li>`)
      .join('');
  }

  // Subscribe — re-render whenever root changes
  const unsubscribe = tree.subscribe('/', render);

  // Initial render
  await render();

  // Create a file on button click
  createBtn.addEventListener('click', async () => {
    const file = await tree.newFile({ path: `/file-${Date.now()}.txt` });
    if (!file.ok) {
      errorEl.textContent = file.error;
    }
    // subscribe fires render() automatically — no manual call needed
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    unsubscribe();
    tree.close();
  });
}

main();
```

---

## Vue 3 — Composition API

### Opening the filesystem (once, in App.vue)

```vue
<!-- App.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide } from 'vue';
import { ExplorerTree } from 'buritifs';
import type { ExplorerFolder } from 'buritifs';

const root = ref<ExplorerFolder | null>(null);
const status = ref<'loading' | 'error' | 'ready'>('loading');
const initError = ref<string | null>(null);
let tree: ExplorerTree | null = null;

onMounted(async () => {
  const result = await ExplorerTree.create({ name: 'my-app' });
  if (!result.ok) {
    initError.value = result.error;
    status.value = 'error';
    return;
  }
  root.value = result;
  tree = result.tree;
  status.value = 'ready';
});

onUnmounted(() => {
  tree?.close();
});

provide('root', root);
</script>

<template>
  <p v-if="status === 'loading'">Opening filesystem...</p>
  <p v-else-if="status === 'error'">Error: {{ initError }}</p>
  <FileManager v-else />
</template>
```

### Reactive folder composable

```typescript
// composables/useFileList.ts
import { ref, watchEffect, onUnmounted } from 'vue';
import type { ExplorerFolder, ListItem } from 'buritifs';

export function useFileList(
  folder: ExplorerFolder,
  options?: { recursive?: boolean; filter?: (item: ListItem) => boolean }
) {
  const items = ref<ListItem[]>([]);
  const loading = ref(true);
  const error = ref<string | null>(null);

  let unsubscribe: (() => void) | null = null;

  async function load() {
    loading.value = true;
    const result = await folder.list(options);
    if (!result.ok) {
      error.value = result.error;
    } else {
      items.value = result.items;
      error.value = null;
    }
    loading.value = false;
  }

  unsubscribe = folder.tree.subscribe(folder.path, load);
  load();

  onUnmounted(() => {
    unsubscribe?.();
  });

  return { items, loading, error };
}
```

```vue
<!-- FileManager.vue -->
<script setup lang="ts">
import { inject } from 'vue';
import type { Ref } from 'vue';
import type { ExplorerFolder } from 'buritifs';
import { useFileList } from './composables/useFileList';

const root = inject<Ref<ExplorerFolder>>('root')!;
const { items, loading, error } = useFileList(root.value);
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

## Svelte

### Opening the filesystem (once, in +layout.svelte or App.svelte)

```svelte
<!-- App.svelte -->
<script lang="ts">
  import { onMount, onDestroy, setContext } from 'svelte';
  import { ExplorerTree } from 'buritifs';
  import type { ExplorerFolder } from 'buritifs';

  let status: 'loading' | 'error' | 'ready' = 'loading';
  let initError: string | null = null;
  let root: ExplorerFolder | null = null;

  onMount(async () => {
    const result = await ExplorerTree.create({ name: 'my-app' });
    if (!result.ok) {
      initError = result.error;
      status = 'error';
      return;
    }
    root = result;
    setContext('root', root);
    status = 'ready';
  });

  onDestroy(() => {
    root?.tree.close();
  });
</script>

{#if status === 'loading'}
  <p>Opening filesystem...</p>
{:else if status === 'error'}
  <p>Error: {initError}</p>
{:else}
  <slot />
{/if}
```

### Reactive folder component

```svelte
<!-- FileList.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { ExplorerFolder, ListItem } from 'buritifs';

  export let folder: ExplorerFolder;

  let items: ListItem[] = [];
  let loading = true;
  let error: string | null = null;
  let unsubscribe: (() => void) | null = null;

  async function load() {
    loading = true;
    const result = await folder.list();
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
    unsubscribe = folder.tree.subscribe(folder.path, load);
  });

  onDestroy(() => {
    unsubscribe?.();
  });
</script>

{#if loading}
  <p>Loading...</p>
{:else if error}
  <p>{error}</p>
{:else if items.length === 0}
  <p>Empty folder.</p>
{:else}
  <ul>
    {#each items as item (item.path)}
      <li>{item.path} ({item.type})</li>
    {/each}
  </ul>
{/if}
```

---

## Angular

Angular's change detection runs outside of BuritiFS callbacks. Wrap state updates inside `NgZone.run()` so that Angular knows it needs to re-render:

```typescript
// file-list.component.ts
import { Component, Input, OnInit, OnDestroy, NgZone } from '@angular/core';
import type { ExplorerFolder, ListItem } from 'buritifs';

@Component({
  selector: 'app-file-list',
  template: `
    <p *ngIf="loading">Loading...</p>
    <p *ngIf="error">{{ error }}</p>
    <ul *ngIf="!loading && !error">
      <li *ngFor="let item of items; trackBy: trackByPath">
        {{ item.path }} ({{ item.type }})
      </li>
    </ul>
  `,
})
export class FileListComponent implements OnInit, OnDestroy {
  @Input() folder!: ExplorerFolder;

  items: ListItem[] = [];
  loading = true;
  error: string | null = null;

  private unsubscribe: (() => void) | null = null;

  constructor(private zone: NgZone) {}

  ngOnInit() {
    this.load();
    this.unsubscribe = this.folder.tree.subscribe(this.folder.path, () => {
      // NgZone.run() triggers Angular change detection
      this.zone.run(() => this.load());
    });
  }

  ngOnDestroy() {
    this.unsubscribe?.();
  }

  trackByPath(_: number, item: ListItem) {
    return item.path;
  }

  private async load() {
    this.loading = true;
    const result = await this.folder.list();
    this.zone.run(() => {
      if (!result.ok) {
        this.error = result.error;
      } else {
        this.items = result.items;
        this.error = null;
      }
      this.loading = false;
    });
  }
}
```

> Without `NgZone.run()`, Angular will not detect the state change and the template will not update until the next user interaction triggers change detection.

---

## Choosing a Path to Subscribe To

- Subscribe to `'/'` to observe the entire filesystem.
- Subscribe to a specific folder path to observe only that folder and its descendants.
- The more specific the subscription, the fewer unnecessary re-renders you'll trigger.

```typescript
// Observes everything — use for a status bar or global indicator
tree.subscribe('/', updateStatusBar);

// Observes only /projects and below — use for a project file browser
tree.subscribe('/projects', renderProjectList);
```
