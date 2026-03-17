

import StorageIndexedDB from "../storage/crud";
import type { PropsClassMainType, ReturnedExplorerFolderType } from "../types/general";
import ExplorerFolder from "./folder";


export default class ExplorerTree extends StorageIndexedDB {

  private constructor(props:PropsClassMainType){
    super(props);
  }

  static async create(props:PropsClassMainType):Promise<ReturnedExplorerFolderType>{
    const instance = new ExplorerTree(props);
    await instance.openDB();
    try {
      await instance.transact("readwrite", (store) => {
        store.put({
          path:'/',
          type:'folder'
        });
      });
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
    return new ExplorerFolder('/', instance);
  }

}



