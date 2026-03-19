



import type { PropsClassAddNoteBD, PropsClassMainType, TableBuritiTypeBD } from "../types/general";
import InitStorageIndexedDB from "./init";

export default class StorageIndexedDB extends InitStorageIndexedDB {

  constructor(props:PropsClassMainType){
    super(props);
  }

  async getSource(props:{path:string}):Promise<TableBuritiTypeBD>{
    const propsTrated = await this.pathTrated(props.path);
    if(!propsTrated.table) throw new Error(`Path ${props.path} does not exist`);
    return propsTrated.table;
  }

  async addNode({path, type}:PropsClassAddNoteBD):Promise<void>{

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

  async removeNode({path}:{path:string}):Promise<void>{

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

}


