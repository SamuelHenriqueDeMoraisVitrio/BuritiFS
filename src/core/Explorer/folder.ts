

import StorageIndexedDB from "../storage/crud";
import type { ReturnedExplorerFileType, ReturnedExplorerFolderType } from "../types/general";
import ExplorerFile from "./file";

export default class ExplorerFolder {

  private base:string;
  private storage:StorageIndexedDB;

  readonly ok: true = true;
  readonly error: null = null;

  constructor(base:string, storage:StorageIndexedDB){
    this.base = (base == '/' ? base : (base.endsWith('/') ? base : `${base}/`)) ?? '/';
    this.storage = storage;
  }

  // ─── New ──────────────────────────────────────────────────
  
  async newFolder(name:string):Promise<ReturnedExplorerFolderType>{
    const path = `${this.base}${name}`;
    try {
      await this.storage.addNode({path, type:'folder'});
      return new ExplorerFolder(path, this.storage);
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
  }

  async newFile(name:string):Promise<ReturnedExplorerFileType>{
    const path = `${this.base}${name}`;
    try {
      await this.storage.addNode({path, type:'file'});
      return new ExplorerFile(path, this.storage);
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
  }

  // ─── Refactor ─────────────────────────────────────────────
  
  // List
  // Get 'aa' | 'aa/bb';
  // rename
  // delete

}

