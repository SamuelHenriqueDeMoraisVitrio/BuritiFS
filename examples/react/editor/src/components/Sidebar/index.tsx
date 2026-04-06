import { useState, useEffect } from 'react'
import { useFolder, type ExplorerFile, type ExplorerFolder, type ListItem } from 'buritifs/react'

function getNameFromPath(path: string): string {
  return path.split('/').filter(Boolean).pop() ?? path
}

interface SidebarProps {
  root: ExplorerFolder
  openedFilePath: string | null
  onFileClick: (file: ExplorerFile) => void
  onReset: () => void
  onContextMenu: (
    e: React.MouseEvent,
    target: ListItem | null,
    targetParent: ExplorerFolder,
    createIn: ExplorerFolder
  ) => void
}

interface FolderNodeProps {
  folder: ExplorerFolder
  openedFilePath: string | null
  onFileClick: (file: ExplorerFile) => void
  onContextMenu: SidebarProps['onContextMenu']
  depth: number
}

interface SubFolderItemProps {
  parentFolder: ExplorerFolder
  item: ListItem
  openedFilePath: string | null
  onFileClick: (file: ExplorerFile) => void
  onContextMenu: SidebarProps['onContextMenu']
  depth: number
}

function SubFolderItem({ parentFolder, item, openedFilePath, onFileClick, onContextMenu, depth }: SubFolderItemProps) {
  const [subFolder, setSubFolder] = useState<ExplorerFolder | null>(null)
  const [expanded, setExpanded] = useState(false)
  const name = getNameFromPath(item.path)
  const paddingLeft = `${(depth + 1) * 12}px`

  useEffect(() => {
    parentFolder.get({ name }).then(result => {
      if (!result.ok) return
      if (result.type !== 'folder') return
      setSubFolder(result)
    })
  }, [parentFolder, name])

  return (
    <li>
      <div
        className="flex items-center gap-1 py-0.5 px-2 hover:bg-[#2a2d2e] cursor-pointer text-[#cccccc]"
        style={{ paddingLeft }}
        onClick={() => setExpanded(prev => !prev)}
        onContextMenu={e => {
          e.preventDefault()
          e.stopPropagation()
          if (subFolder) onContextMenu(e, item, parentFolder, subFolder)
        }}
      >
        <span
          className="text-xs transition-transform duration-100"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          ▶
        </span>
        <span>{name}</span>
      </div>
      {expanded && subFolder && (
        <FolderNode
          folder={subFolder}
          openedFilePath={openedFilePath}
          onFileClick={onFileClick}
          onContextMenu={onContextMenu}
          depth={depth + 1}
        />
      )}
    </li>
  )
}

function FolderNode({ folder, openedFilePath, onFileClick, onContextMenu, depth }: FolderNodeProps) {
  const { items } = useFolder(folder)

  return (
    <ul>
      {items.map(item => {
        if (item.type === 'folder') {
          return (
            <SubFolderItem
              key={item.path}
              parentFolder={folder}
              item={item}
              openedFilePath={openedFilePath}
              onFileClick={onFileClick}
              onContextMenu={onContextMenu}
              depth={depth}
            />
          )
        }

        const name = getNameFromPath(item.path)
        const paddingLeft = `${(depth + 1) * 12}px`
        const isActive = item.path === openedFilePath

        return (
          <li key={item.path}>
            <div
              className={`flex items-center gap-1 py-0.5 px-2 cursor-pointer text-[#cccccc] ${
                isActive ? 'bg-[#37373d]' : 'hover:bg-[#2a2d2e]'
              }`}
              style={{ paddingLeft }}
              onClick={async () => {
                const result = await folder.get({ name })
                if (!result.ok) return
                if (result.type !== 'file') return
                onFileClick(result)
              }}
              onContextMenu={e => {
                e.preventDefault()
                e.stopPropagation()
                onContextMenu(e, item, folder, folder)
              }}
            >
              <span>{name}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function Sidebar({ root, openedFilePath, onFileClick, onReset, onContextMenu }: SidebarProps) {
  return (
    <aside
      className="w-56 bg-[#252526] border-r border-[#3c3c3c] flex flex-col overflow-y-auto shrink-0"
      onContextMenu={e => { e.preventDefault(); onContextMenu(e, null, root, root) }}
    >
      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#bbbbbbb] border-b border-[#3c3c3c] flex items-center justify-between">
        <span>Explorer</span>
        <div className="flex items-center gap-1">
          <button
            className="text-[#cccccc] hover:text-white leading-none px-1"
            title="Reset to initial files"
            onClick={e => {
              e.stopPropagation()
              onReset()
            }}
          >
            ↺
          </button>
          <button
            className="text-[#cccccc] hover:text-white leading-none px-1"
            title="New file or folder"
            onClick={e => {
              e.stopPropagation()
              onContextMenu(e, null, root, root)
            }}
          >
            +
          </button>
        </div>
      </div>
      <FolderNode
        folder={root}
        openedFilePath={openedFilePath}
        onFileClick={onFileClick}
        onContextMenu={onContextMenu}
        depth={0}
      />
    </aside>
  )
}
