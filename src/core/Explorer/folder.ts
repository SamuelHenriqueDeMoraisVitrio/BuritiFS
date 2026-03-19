

import type { ReturnedErrorOrSucessExplorerType, ReturnedExplorerFileType, ReturnedExplorerFolderType } from "../types/general";
import type ExplorerTree from "./ExplorerMain";

export default class ExplorerFolder {

  private base:string;
  private storage:ExplorerTree;

  readonly ok: true = true;
  readonly error: null = null;

  constructor(base:string, storage:ExplorerTree){
    this.base = base == '/' ? base : (base.endsWith('/') ? base : `${base}/`);
    this.storage = storage;
  }

  // ─── Get ──────────────────────────────────────────────────

  async get({name}:{name:string}):Promise<ReturnedExplorerFileType | ReturnedExplorerFolderType>{
    const path = `${this.base}${name}`;
    return await this.storage.source({path});
  }

  // ─── New ──────────────────────────────────────────────────

  async newFolder({name}:{name:string}):Promise<ReturnedExplorerFolderType>{
    const path = `${this.base}${name}`;
    return await this.storage.newFolder({path});
  }

  async newFile({name}:{name:string}):Promise<ReturnedExplorerFileType>{
    const path = `${this.base}${name}`;
    return await this.storage.newFile({path});
  }

  // ─── Refactor ─────────────────────────────────────────────

  async copy({to, merge, priority}:{to:string, merge?:boolean, priority?:'source'|'destination'}):Promise<ReturnedExplorerFolderType>{
    const result = await this.storage.copy({fromPath: this.base, toPath: to, merge, priority});
    if (!result.ok) return result;
    return await this.storage.source({path: to}) as ReturnedExplorerFolderType;
  }

  async move({to, merge, priority}:{to:string, merge?:boolean, priority?:'source'|'destination'}):Promise<ReturnedExplorerFolderType>{
    const result = await this.storage.move({fromPath: this.base, toPath: to, merge, priority});
    if (!result.ok) return result;
    return await this.storage.source({path: to}) as ReturnedExplorerFolderType;
  }

  async delete():Promise<ReturnedErrorOrSucessExplorerType>{
    return await this.storage.delete({path: this.base});
  }

}

