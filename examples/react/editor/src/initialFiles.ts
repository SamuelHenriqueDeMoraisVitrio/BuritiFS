import type { ExplorerFolder } from 'buritifs'

const SEED_KEY = 'buritifs-editor-seeded'
const BASE_URL = 'https://raw.githubusercontent.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/main/'

const DOC_PATHS = [
  'README.md',
  'docs/getting-started.md',
  'docs/core/overview.md',
  'docs/core/explorer-tree.md',
  'docs/core/explorer-folder.md',
  'docs/core/explorer-file.md',
  'docs/core/events.md',
  'docs/core/error-handling.md',
  'docs/react/overview.md',
  'docs/react/use-explorer.md',
  'docs/react/use-folder.md',
  'docs/react/use-action.md',
  'docs/guides/without-react.md',
  'docs/guides/browser-support.md',
  'docs/guides/roadmap.md',
  'docs/contributing/setup.md',
  'docs/contributing/architecture.md',
  'docs/contributing/build.md',
  'docs/contributing/testing.md',
]

async function fetchFile(path: string): Promise<string> {
  try {
    const response = await fetch(BASE_URL + path)
    if (!response.ok) return ''
    return await response.text()
  } catch {
    return ''
  }
}

async function getOrCreateFolder(parent: ExplorerFolder, name: string): Promise<ExplorerFolder | null> {
  const existing = await parent.get({ name })
  if (existing.ok && existing.type === 'folder') return existing

  const created = await parent.newFolder({ name })
  if (!created.ok) return null
  return created
}

async function writeFile(root: ExplorerFolder, path: string, content: string): Promise<void> {
  const parts = path.split('/')
  const fileName = parts[parts.length - 1]
  const folderParts = parts.slice(0, -1)

  let currentFolder = root
  for (const name of folderParts) {
    const next = await getOrCreateFolder(currentFolder, name)
    if (!next) return
    currentFolder = next
  }

  const file = await currentFolder.newFile({ name: fileName })
  if (!file.ok) return
  await file.write({ content })
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

  if (window.location.hostname === 'localhost') {
    const file = await root.newFile({ name: 'README.md' })
    if (file.ok) await file.write({ content: '# BuritiFS Editor\n\nRunning in development mode.' })
    localStorage.setItem(SEED_KEY, '1')
    return
  }

  const contents = await Promise.all(DOC_PATHS.map(fetchFile))

  for (let i = 0; i < DOC_PATHS.length; i++) {
    await writeFile(root, DOC_PATHS[i], contents[i])
  }

  localStorage.setItem(SEED_KEY, '1')
}
