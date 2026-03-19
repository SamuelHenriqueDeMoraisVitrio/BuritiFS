

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

  // ─── Get ──────────────────────────────────────────────────

  async source({path}:{path:string}):Promise<ReturnedExplorerFileType | ReturnedExplorerFolderType>{
    try {
      const table = await this.getSource({path});
      if(table.type === 'folder') return new ExplorerFolder(table.path, this);
      if(table.type === 'file') return new ExplorerFile(table.path, this);
      return {ok:false, error:`Internal error: entity at "${path}" has no valid type`};
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
  }

  // ─── Info ─────────────────────────────────────────────────

  async type({path}:{path:string}):Promise<string|null>{
    try {
      const entity = await this.getSource({path});
      return entity.path === '/' ? 'folder' : entity.type;
    } catch (e) {
      return null;
    }
  }

  // ─── New ──────────────────────────────────────────────────
  
  async newFolder({path}:{path:string}):Promise<ReturnedExplorerFolderType>{
    try {
      await this.addNode({path, type:'folder'});
      return new ExplorerFolder(path, this);
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
  }

  async newFile({path}:{path:string}):Promise<ReturnedExplorerFileType>{
    try {
      await this.addNode({path, type:'file'});
      return new ExplorerFile(path, this);
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
  }

  // ─── Refactor ─────────────────────────────────────────────

  // mov or movGroup
  // copy or copyGroup
  // zip. Talvez futuramente.
  // Sync Github. Talvez futuramente.

}



