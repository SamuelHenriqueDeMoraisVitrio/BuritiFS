



import { PropsClassAddNoteBD, PropsClassMainType } from "../types/general";
import InitStorageIndexedDB from "./init";

export default class StorageIndexedDB extends InitStorageIndexedDB {

  constructor(props:PropsClassMainType){
    super(props);
  }

  async addNode({path, type}:PropsClassAddNoteBD):Promise<void>{

    const propsTrated = await this.pathTrated({path, type});
    if(propsTrated.path === '/') throw new Error("Cannot add root node");

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

}


