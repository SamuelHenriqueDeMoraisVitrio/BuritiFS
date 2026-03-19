

import type { ListItem, ReturnedErrorOrSucessExplorerType, ReturnedExplorerFileType, ReturnedExplorerFolderType, ReturnedExplorerInfoType, ReturnedExplorerListType } from "../types/general";
import type ExplorerTree from "./ExplorerMain";

export default class ExplorerFolder {

  private base:string;
  private storage:ExplorerTree;

  readonly ok: true = true;
  readonly error: null = null;
  readonly type: 'folder' = 'folder';

  get path(): string { return this.base === '/' ? '/' : this.base.slice(0, -1); }

  constructor(base:string, storage:ExplorerTree){
    this.base = base == '/' ? base : (base.endsWith('/') ? base : `${base}/`);
    this.storage = storage;
  }

  // ─── Info ─────────────────────────────────────────────────

  async info():Promise<ReturnedExplorerInfoType>{
    return await this.storage.info({path: this.path});
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

  async rename({name}:{name:string}):Promise<ReturnedErrorOrSucessExplorerType>{
    const path = this.base === '/' ? '/' : this.base.slice(0, -1);
    const result = await this.storage.rename({path, name});
    if (!result.ok) return result;
    const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
    this.base = `${parentPath === '/' ? '' : parentPath}/${name}/`;
    return {ok:true, error:null};
  }

  async copy({to, merge, priority}:{to:string, merge?:boolean, priority?:'source'|'destination'}):Promise<ReturnedExplorerFolderType>{
    const result = await this.storage.copy({fromPath: this.base, toPath: to, merge, priority});
    if (!result.ok) return result;
    return await this.storage.source({path: to}) as ReturnedExplorerFolderType;
  }

  async move({to, merge, priority}:{to:string, merge?:boolean, priority?:'source'|'destination'}):Promise<ReturnedErrorOrSucessExplorerType>{
    const result = await this.storage.move({fromPath: this.base, toPath: to, merge, priority});
    if (!result.ok) return result;
    const newInstance = await this.storage.source({path: to});
    if (newInstance instanceof ExplorerFolder) this.base = newInstance.base;
    return {ok:true, error:null};
  }

  async delete():Promise<ReturnedErrorOrSucessExplorerType>{
    return await this.storage.delete({path: this.base});
  }

  async list({recursive, limit, page, filter}:{recursive?:boolean, limit?:number, page?:number, filter?:(item:ListItem)=>boolean}={}):Promise<ReturnedExplorerListType>{
    return await this.storage.list({path: this.path, recursive, limit, page, filter});
  }

}

