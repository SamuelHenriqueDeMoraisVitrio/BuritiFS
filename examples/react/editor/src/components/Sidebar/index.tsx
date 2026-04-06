import { useFolder, type ExplorerFile, type ExplorerFolder } from 'buritifs/react'

interface SidebarProps {
  root: ExplorerFolder
  onFileClick: (file: ExplorerFile) => void
}

interface FolderNodeProps {
  folder: ExplorerFolder
  onFileClick: (file: ExplorerFile) => void
  depth: number
}

function FolderNode({ folder, onFileClick, depth }: FolderNodeProps) {
  const { items } = useFolder(folder)

  return (
    <ul>
      {items.map(item => {
        const paddingLeft = `${(depth + 1) * 12}px`

        if (item.type === 'folder') {
          return (
            <li key={item.path}>
              <div
                className="flex items-center gap-1 py-0.5 px-2 hover:bg-[#2a2d2e] cursor-pointer text-[#cccccc]"
                style={{ paddingLeft }}
              >
                <span className="text-xs">▶</span>
                <span>{item.name}</span>
              </div>
              <FolderNode
                folder={item as ExplorerFolder}
                onFileClick={onFileClick}
                depth={depth + 1}
              />
            </li>
          )
        }

        return (
          <li key={item.path}>
            <div
              className="flex items-center gap-1 py-0.5 px-2 hover:bg-[#2a2d2e] cursor-pointer text-[#cccccc]"
              style={{ paddingLeft }}
              onClick={() => onFileClick(item as ExplorerFile)}
            >
              <span>{item.name}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function Sidebar({ root, onFileClick }: SidebarProps) {
  return (
    <aside className="w-56 bg-[#252526] border-r border-[#3c3c3c] flex flex-col overflow-y-auto shrink-0">
      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#bbbbbbb] border-b border-[#3c3c3c]">
        Explorer
      </div>
      <FolderNode folder={root} onFileClick={onFileClick} depth={0} />
    </aside>
  )
}
