# Browser Support

BuritiFS relies on two browser storage APIs: **OPFS** (Origin Private File System) for file content and **IndexedDB** for metadata. Both must be available for the library to work fully.

---

## Compatibility Table

| Browser | Version | IndexedDB | OPFS | Status |
|---|---|---|---|---|
| Chrome | 86+ | Yes | Yes | Fully supported |
| Edge | 86+ | Yes | Yes | Fully supported |
| Safari | 15.2+ | Yes | Yes | Fully supported |
| Firefox | 111+ | Yes | Partial* | Partial support |
| Opera | 72+ | Yes | Yes | Fully supported |
| Samsung Internet | 14+ | Yes | Yes | Fully supported |
| iOS Safari | 15.2+ | Yes | Yes | Fully supported |

> \* See the Firefox section below.

---

## Firefox — Partial OPFS Support

Firefox added OPFS support in version 111, but there are two limitations:

1. **`createSyncAccessHandle` is unavailable** — Firefox does not implement the synchronous access handle API. BuritiFS uses only the asynchronous OPFS API, so this is not currently a blocker.

2. **Service Workers** — OPFS in Firefox behaves differently within Service Worker contexts. If you plan to use BuritiFS from a Service Worker, test thoroughly on Firefox.

3. **Older Firefox versions** — Firefox versions below 111 have no OPFS support at all. On these versions, `ExplorerTree.create()` will fail with an error.

For most web app use cases (running BuritiFS in the main thread), Firefox 111+ works. For thorough cross-browser compatibility, always run feature detection before initializing the filesystem.

---

## Private Browsing / Incognito Mode

Both OPFS and IndexedDB are available in private/incognito mode, but storage is scoped to the session — data does not persist after the window closes. BuritiFS will initialize correctly, but treat storage as ephemeral in this context.

Some browsers impose stricter storage quotas in private mode.

---

## Feature Detection

Check for support before calling `ExplorerTree.create()`:

```typescript
async function isBuritiSupported(): Promise<boolean> {
  // Check IndexedDB
  if (typeof indexedDB === 'undefined') return false;

  // Check OPFS
  if (!navigator.storage || typeof navigator.storage.getDirectory !== 'function') {
    return false;
  }

  // Try to actually open OPFS (some browsers report the API but restrict access)
  try {
    await navigator.storage.getDirectory();
    return true;
  } catch {
    return false;
  }
}
```

Using it with BuritiFS:

```typescript
import { ExplorerTree } from 'buritifs';

async function initFilesystem() {
  const supported = await isBuritiSupported();

  if (!supported) {
    showUnsupportedMessage();
    return;
  }

  const result = await ExplorerTree.create({ name: 'my-app' });

  if (!result.ok) {
    console.error('Init failed:', result.error);
    return;
  }

  startApp(result);
}
```

---

## Storage Quotas

OPFS and IndexedDB storage is subject to browser storage quotas, which vary by browser and available disk space. Use the Storage API to check available quota:

```typescript
async function checkStorageQuota() {
  if (!navigator.storage || !navigator.storage.estimate) return;

  const estimate = await navigator.storage.estimate();
  const used = estimate.usage ?? 0;
  const quota = estimate.quota ?? 0;

  console.log(`Used: ${(used / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Quota: ${(quota / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Available: ${((quota - used) / 1024 / 1024).toFixed(1)} MB`);
}
```

---

## Persistent Storage

By default, browsers may evict OPFS and IndexedDB data under storage pressure. To request persistent storage that survives eviction:

```typescript
async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage || !navigator.storage.persist) return false;

  const persisted = await navigator.storage.persist();
  console.log(persisted ? 'Storage is persistent.' : 'Storage may be evicted.');
  return persisted;
}
```

The browser may prompt the user for permission. On Chrome, persistent storage is granted automatically for installed PWAs.

---

## Web Workers

BuritiFS is designed to run on the **main thread**. Both the asynchronous OPFS API and IndexedDB are available in Web Workers, but the React hooks rely on the React lifecycle and must run on the main thread.

If you want to move I/O off the main thread, you can use the core `ExplorerTree` API from a dedicated Worker and communicate results to the main thread via `postMessage`. This is an advanced pattern not yet covered by first-party helpers.

---

## Cross-Origin Isolation

OPFS does not require cross-origin isolation. You do not need to set `Cross-Origin-Opener-Policy` or `Cross-Origin-Embedder-Policy` headers to use BuritiFS.

The synchronous access handle (`createSyncAccessHandle`) — used in some OPFS patterns — does require cross-origin isolation, but BuritiFS does not use it.
