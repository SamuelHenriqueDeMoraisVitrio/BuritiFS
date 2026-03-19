



import type { PropsClassAddNoteBD, PropsClassMainType, TableBuritiTypeBD } from "../types/general";
import InitStorageIndexedDB from "./init";

export default class StorageIndexedDB extends InitStorageIndexedDB {

  constructor(props:PropsClassMainType){
    super(props);
  }

  protected async getSource(props:{path:string}):Promise<TableBuritiTypeBD>{
    const propsTrated = await this.pathTrated(props.path);
    if(!propsTrated.table) throw new Error(`Path ${props.path} does not exist`);
    return propsTrated.table;
  }

  protected async addNode({path, type}:PropsClassAddNoteBD):Promise<void>{

    if(type !== 'file' && type !== 'folder') throw new Error("Type must be 'file' or 'folder'");
    if(path == '/') throw new Error("Should not create the root folder.");

    const propsTrated = await this.pathTrated(path);
    if(propsTrated.path === '/') throw new Error("Cannot add root node");
    if(propsTrated.table && propsTrated.table.type !== type) throw new Error(`Path "${path}" already exists as a "${propsTrated.table.type}"`);

    const now = Date.now();

    await this.transact("readwrite", (store) => {
      store.put({
        path:propsTrated.path,
        parent:propsTrated.parent,
        type,
        createdAt: propsTrated.table ? propsTrated.table.createdAt : now,
        updatedAt: now
      });
    });
  }

  protected async removeNode({path}:{path:string}):Promise<void>{

    if(path === '/') throw new Error('Cannot remove root node.');

    const node = await this.getSource({path});

    if (node.type === 'file'){
      await this.transact("readwrite", store => store.delete(node.path));
      return;
    }

    if (node.type === 'folder'){
      await this.transact("readwrite", store => {
        store.delete(IDBKeyRange.bound(node.path+'/', (node.path+'/') + "\uffff"));
        store.delete(node.path);
      });
      return;
    }

    throw new Error(`Unknown node type "${(node as TableBuritiTypeBD).type}" at path "${path}".`);

  }

  protected async copyNode({
    fromPath,
    toPath,
    merge = false,
    priority = 'source'
  }: {
    fromPath: string;
    toPath: string;
    merge?: boolean;
    priority?: 'source' | 'destination';
  }): Promise<void>{

    if (fromPath === '/' || toPath === '/') throw new Error('Cannot copy root node.');

    const fromEntity = await this.getSource({path: fromPath});
    const toEntityProps = await this.pathTrated(toPath);

    const now = Date.now();
    const remap = (oldPath: string) => toEntityProps.path + oldPath.slice(fromEntity.path.length);
    const remapParent = (oldParent: string | null): string | null =>
      oldParent === null
        ? null
        : oldParent === fromEntity.path
          ? toEntityProps.path
          : remap(oldParent);

    // ─── File ─────────────────────────────────────────────────

    if (fromEntity.type === 'file') {
      if (priority === 'destination' && !!toEntityProps.table) return;
      if (!!toEntityProps.table) await this.removeNode({path: toEntityProps.path});
      await this.transact('readwrite', (store) => {
        store.put({...fromEntity, path: toEntityProps.path, parent: toEntityProps.parent, updatedAt: now});
      });
      return;
    }

    // ─── Folder ───────────────────────────────────────────────

    if (fromEntity.type === 'folder') {

      if (priority === 'destination') {
        if (!merge && !!toEntityProps.table) return;
        if (toEntityProps.table?.type === 'file') return;
      }

      if (!merge && !!toEntityProps.table) await this.removeNode({path: toEntityProps.path});
      else if (toEntityProps.table?.type === 'file') await this.removeNode({path: toEntityProps.path});

      await this.addNode({path: toEntityProps.path, type: 'folder'});

      const range = IDBKeyRange.bound(fromEntity.path + '/', fromEntity.path + '/' + '\uffff');

      await this.transact('readwrite', (store) => {
        const req = store.openCursor(range);
        req.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
          if (!cursor) return;

          const node = cursor.value as TableBuritiTypeBD;
          const newPath = remap(node.path);
          const newParent = remapParent(node.parent);

          if (merge && priority === 'destination') {
            const check = store.get(newPath);
            check.onsuccess = () => {
              if (!check.result) store.put({...node, path: newPath, parent: newParent, updatedAt: now});
              cursor.continue();
            };
          } else {
            store.put({...node, path: newPath, parent: newParent, updatedAt: now});
            cursor.continue();
          }
        };
      });
    }
  }

  protected async moveNode({
    fromPath,
    toPath,
    merge = false,
    priority = 'source'
  }: {
    fromPath: string;
    toPath: string;
    merge?: boolean;
    priority?: 'source' | 'destination';
  }): Promise<void> {

    if (fromPath === '/' || toPath === '/') throw new Error('Cannot move root node.');

    const fromNorm = await this.pathTrated(fromPath);
    const toNorm   = await this.pathTrated(toPath);

    if (fromNorm.path === toNorm.path) throw new Error('Cannot move a node to itself.');
    if (toNorm.path.startsWith(fromNorm.path + '/')) throw new Error('Cannot move a folder into one of its own descendants.');

    await this.copyNode({ fromPath, toPath, merge, priority });
    await this.removeNode({ path: fromNorm.path });
  }

}


