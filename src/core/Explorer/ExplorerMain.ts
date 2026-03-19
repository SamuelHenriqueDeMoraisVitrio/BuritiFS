

import StorageIndexedDB from "../storage/crud";
import type { PropsClassMainType, ReturnedErrorExplorerType, ReturnedExplorerFileType, ReturnedExplorerFolderType } from "../types/general";
import ExplorerFile from "./file";
import ExplorerFolder from "./folder";


export default class ExplorerTree extends StorageIndexedDB {

  private constructor(props:PropsClassMainType){
    super(props);
  }

  static async create(props:PropsClassMainType):Promise<ExplorerTree | ReturnedErrorExplorerType>{
    const instance = new ExplorerTree(props);
    try {
      await instance.openDB();
      await instance.transact("readwrite", (store) => {
        store.put({
          path:'/',
          type:'folder',
          parent:null,
          // Timestamps are 0 to mark the root as a sentinel node, not a user-created entry.
          createdAt:0,
          updatedAt:0
        });
      });
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
    return instance;
  }

  async source(path:string):Promise<ReturnedExplorerFileType | ReturnedExplorerFolderType>{
    try {
      const table = await this.getSource({path});
      if(table.type === 'folder') return new ExplorerFolder(table.path, this);
      if(table.type === 'file') return new ExplorerFile(table.path, this);
      return {ok:false, error:`Internal error: entity at "${path}" has no valid type`};
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
  }

  // mov or movGroup
  // copy or copyGroup
  // zip. Talvez futuramente.
  // Sync Github. Talvez futuramente.

}



