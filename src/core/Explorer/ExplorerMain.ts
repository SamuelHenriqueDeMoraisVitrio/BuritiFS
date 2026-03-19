

import StorageIndexedDB from "../storage/crud";
import type { PropsClassMainType, ReturnedErrorExplorerType, ReturnedErrorOrSucessExplorerType, ReturnedExplorerFileType, ReturnedExplorerFolderType } from "../types/general";
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
      const now = Date.now();
      const existing = await instance.request<{ createdAt: number } | null>('readonly', store => store.get('/'));
      await instance.transact("readwrite", (store) => {
        store.put({
          path:'/',
          type:'folder',
          parent:null,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now
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
  
  async delete({path}:{path:string}):Promise<ReturnedErrorOrSucessExplorerType>{
    try {
      await this.removeNode({path});
      return {ok:true, error:null};
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
  }

  async copy({fromPath, toPath, merge, priority}:{fromPath:string, toPath:string, merge?:boolean, priority?:'source'|'destination'}):Promise<ReturnedErrorOrSucessExplorerType>{
    try {
      await this.copyNode({fromPath, toPath, merge, priority});
      return {ok:true, error:null};
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
  }

  async move({fromPath, toPath, merge, priority}:{fromPath:string, toPath:string, merge?:boolean, priority?:'source'|'destination'}):Promise<ReturnedErrorOrSucessExplorerType>{
    try {
      await this.moveNode({fromPath, toPath, merge, priority});
      return {ok:true, error:null};
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
  }

  async rename({path, name}:{path:string, name:string}):Promise<ReturnedErrorOrSucessExplorerType>{
    try {
      const normalized = await this.pathTrated(path);
      const parent = normalized.parent ?? '/';
      const toPath = `${parent === '/' ? '' : parent}/${name}`;
      await this.moveNode({fromPath: normalized.path, toPath});
      return {ok:true, error:null};
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
  }

  // List
  // zip. Talvez futuramente.
  // Sync Github. Talvez futuramente.

}



