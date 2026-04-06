import type { ExplorerFolder } from 'buritifs'

const SEED_KEY = 'buritifs-editor-seeded'

interface FileEntry {
  path: string
  content: string
}

const INITIAL_FILES: FileEntry[] = [
  {
    path: 'README.md',
    content: `# BuritiFS

BuritiFS is a virtual filesystem that runs entirely in the browser, backed by IndexedDB. It provides a familiar file-system API — create, read, write, rename, copy, move, delete — with full React integration via hooks.

## Installation

\`\`\`bash
npm install buritifs
\`\`\`

## Quick Start

\`\`\`ts
import { ExplorerTree, ExplorerFolder, ExplorerFile } from 'buritifs'

const tree = await ExplorerTree.create({ name: 'my-app' })
if (!(tree instanceof ExplorerTree)) throw new Error(tree.error)

const root = await tree.source({ path: '/' })
if (!(root instanceof ExplorerFolder)) throw new Error(root.error)

const file = await root.newFile({ name: 'hello.txt' })
await file.write({ content: 'Hello, World!' })

const result = await file.read()
console.log(result.text) // "Hello, World!"
\`\`\`

## React Integration

\`\`\`tsx
import { useExplorer, useFolder } from 'buritifs/react'

function App() {
  const explorer = useExplorer('my-app')
  if (explorer.status === 'loading') return <p>Loading...</p>
  if (explorer.status === 'error') return <p>Error: {explorer.error}</p>
  return <FileTree root={explorer.root} />
}
\`\`\`

See \`docs/getting-started.md\` for a full walkthrough and \`docs/api.md\` for the complete API reference.
`,
  },
  {
    path: 'docs/getting-started.md',
    content: `# Getting Started

## Creating a Filesystem

Each filesystem is identified by a name. BuritiFS stores everything in an IndexedDB database with that name, so data persists across page reloads.

\`\`\`ts
import { ExplorerTree, ExplorerFolder } from 'buritifs'

const tree = await ExplorerTree.create({ name: 'my-app' })
if (!(tree instanceof ExplorerTree)) {
  console.error(tree.error)
  return
}
\`\`\`

## Navigating the Filesystem

Use \`tree.source()\` to get a folder or file at any path:

\`\`\`ts
const root = await tree.source({ path: '/' })     // ExplorerFolder
const docs = await tree.source({ path: '/docs' }) // ExplorerFolder
const file = await tree.source({ path: '/README.md' }) // ExplorerFile
\`\`\`

Or navigate relative to a folder with \`folder.get()\`:

\`\`\`ts
const readme = await root.get({ name: 'README.md' })
if (readme.ok && readme.type === 'file') {
  const result = await readme.read()
  console.log(result.text)
}
\`\`\`

## Creating Files and Folders

\`\`\`ts
const docs = await root.newFolder({ name: 'docs' })
if (!docs.ok) return

const guide = await docs.newFile({ name: 'guide.md' })
if (!guide.ok) return

await guide.write({ content: '# Guide\\n\\nHello!' })
\`\`\`

## Renaming and Deleting

\`\`\`ts
await guide.rename({ name: 'getting-started.md' })
await guide.delete()

await docs.rename({ name: 'documentation' })
await docs.delete() // deletes the folder and all its contents
\`\`\`

## Listing Contents

\`\`\`ts
const list = await root.list({})
if (list.ok) {
  for (const item of list.items) {
    console.log(item.path, item.type)
  }
}

// Recursive listing with filter
const mdFiles = await root.list({
  recursive: true,
  filter: item => item.path.endsWith('.md'),
})
\`\`\`

## Reacting to Changes

BuritiFS has a subscription system that propagates changes up the directory tree:

\`\`\`ts
// Listen for any change inside /docs (or its subfolders)
const unsubscribe = tree.subscribe('/docs', () => {
  console.log('Something changed under /docs')
})

// Later:
unsubscribe()
\`\`\`

In React, \`useFolder\` does this automatically — the component re-renders whenever the folder's contents change.
`,
  },
  {
    path: 'docs/api.md',
    content: `# API Reference

## ExplorerTree

The root object. Create one per named database.

| Method | Description |
|--------|-------------|
| \`ExplorerTree.create({ name })\` | Opens (or creates) a database. Returns \`ExplorerTree\` or \`{ ok: false, error }\`. |
| \`ExplorerTree.close({ name })\` | Closes the database connection. |
| \`tree.source({ path })\` | Returns the \`ExplorerFile\` or \`ExplorerFolder\` at the given path. |
| \`tree.newFile({ path })\` | Creates a file at an absolute path. |
| \`tree.newFolder({ path })\` | Creates a folder at an absolute path. |
| \`tree.delete({ path })\` | Deletes a file or folder (recursively). |
| \`tree.rename({ path, name })\` | Renames an item. |
| \`tree.list({ path, recursive?, filter? })\` | Lists items under a path. |
| \`tree.exists({ path })\` | Returns \`true\` if the path exists. |
| \`tree.subscribe(path, fn)\` | Subscribes to changes at a path. Returns unsubscribe function. |

---

## ExplorerFolder

| Method | Description |
|--------|-------------|
| \`folder.get({ name })\` | Gets a child file or folder by name. |
| \`folder.newFile({ name })\` | Creates a file inside this folder. |
| \`folder.newFolder({ name })\` | Creates a subfolder inside this folder. |
| \`folder.list({ recursive?, filter? })\` | Lists immediate children (or recursively). |
| \`folder.rename({ name })\` | Renames this folder. |
| \`folder.copy({ to, merge?, priority? })\` | Copies this folder to another path. |
| \`folder.move({ to, force? })\` | Moves this folder to another path. |
| \`folder.delete()\` | Deletes this folder and all its contents. |
| \`folder.exists()\` | Returns \`true\` if this folder still exists. |
| \`folder.size({ recursive? })\` | Returns the total content size in bytes. |
| \`folder.info()\` | Returns \`{ path, createdAt, updatedAt }\`. |
| \`folder.tree\` | Reference to the parent \`ExplorerTree\`. |
| \`folder.path\` | The absolute path string. |

---

## ExplorerFile

| Method | Description |
|--------|-------------|
| \`file.read()\` | Returns \`{ ok, text, content: ArrayBuffer }\`. |
| \`file.write({ content })\` | Writes string, object, or ArrayBuffer content. |
| \`file.rename({ name })\` | Renames this file (updates \`file.path\` in place). |
| \`file.copy({ to, priority? })\` | Copies this file to another path. |
| \`file.move({ to, force? })\` | Moves this file to another path. |
| \`file.delete()\` | Deletes this file. |
| \`file.exists()\` | Returns \`true\` if this file still exists. |
| \`file.info()\` | Returns \`{ path, createdAt, updatedAt }\`. |
| \`file.path\` | The absolute path string. |

---

## React Hooks

### \`useExplorer(name)\`

Opens a named filesystem. Returns a discriminated union:

\`\`\`ts
| { status: 'loading' }
| { status: 'error'; error: string }
| { status: 'ready'; root: ExplorerFolder }
\`\`\`

Automatically closes the filesystem on unmount.

### \`useFolder(folder, options?)\`

Subscribes to a folder and returns its contents reactively.

\`\`\`ts
const { items, loading, error } = useFolder(folder)
// items: ListItem[] — each has { path, type, createdAt, updatedAt }
\`\`\`

Re-renders automatically when the folder's contents change.

### \`useAction(fn)\`

Wraps an async operation with loading/error state.

\`\`\`ts
const action = useAction(async () => {
  return await folder.newFile({ name: 'new.txt' })
})

// action.run()    — executes the function
// action.loading  — true while running
// action.error    — string | null
// action.reset()  — clears error state
\`\`\`
`,
  },
]

async function getOrCreateFolder(parent: ExplorerFolder, name: string): Promise<ExplorerFolder | null> {
  const existing = await parent.get({ name })
  if (existing.ok && existing.type === 'folder') return existing

  const created = await parent.newFolder({ name })
  if (!created.ok) return null
  return created
}

export async function resetFiles(root: ExplorerFolder): Promise<void> {
  localStorage.removeItem(SEED_KEY)

  const list = await root.list({})
  if (list.ok) {
    for (const item of list.items) {
      const name = item.path.split('/').filter(Boolean).pop()
      if (!name) continue
      const result = await root.get({ name })
      if (result.ok) await result.delete()
    }
  }

  await seedFiles(root)
}

export async function seedFiles(root: ExplorerFolder): Promise<void> {
  if (localStorage.getItem(SEED_KEY)) return

  for (const { path, content } of INITIAL_FILES) {
    const parts = path.split('/')
    const fileName = parts[parts.length - 1]
    const folderParts = parts.slice(0, -1)

    let currentFolder = root
    let failed = false

    for (const name of folderParts) {
      const next = await getOrCreateFolder(currentFolder, name)
      if (!next) { failed = true; break }
      currentFolder = next
    }

    if (failed) continue

    const file = await currentFolder.newFile({ name: fileName })
    if (!file.ok) continue
    await file.write({ content })
  }

  localStorage.setItem(SEED_KEY, '1')
}
