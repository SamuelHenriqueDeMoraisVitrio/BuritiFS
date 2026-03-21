


import type { ReturnedErrorOrSucessExplorerType, ReturnedExplorerFileType, ReturnedExplorerInfoType } from "../types/general";
import type ExplorerTree from "./ExplorerMain";

export default class ExplorerFile {
  private base:string;
  private storage:ExplorerTree;

  readonly ok:true = true;
  readonly error:null = null;
  readonly type: 'file' = 'file';

  get path(): string { return this.base; }

  constructor(base:string, storage:ExplorerTree){
    this.base = base;
    this.storage = storage;
  }

  // ─── Info ─────────────────────────────────────────────────

  async info():Promise<ReturnedExplorerInfoType>{
    return await this.storage.info({path: this.base});
  }

  // ─── Refactor ─────────────────────────────────────────────

  async rename({name}:{name:string}):Promise<ReturnedErrorOrSucessExplorerType>{
    const result = await this.storage.rename({path: this.base, name});
    if (!result.ok) return result;
    const parentPath = this.base.substring(0, this.base.lastIndexOf('/')) || '/';
    this.base = `${parentPath === '/' ? '' : parentPath}/${name}`;
    return {ok:true, error:null};
  }

  async copy({to, merge, priority}:{to:string, merge?:boolean, priority?:'source'|'destination'}):Promise<ReturnedExplorerFileType>{
    const result = await this.storage.copy({fromPath: this.base, toPath: to, merge, priority});
    if (!result.ok) return result;
    return await this.storage.source({path: to}) as ReturnedExplorerFileType;
  }

  async move({to, force}:{to:string, force?:boolean}):Promise<ReturnedErrorOrSucessExplorerType>{
    const result = await this.storage.move({fromPath: this.base, toPath: to, force});
    if (!result.ok) return result;
    const newInstance = await this.storage.source({path: to});
    if (newInstance instanceof ExplorerFile) this.base = newInstance.base;
    return {ok:true, error:null};
  }

  async delete():Promise<ReturnedErrorOrSucessExplorerType>{
    return await this.storage.delete({path: this.base});
  }

  async exists():Promise<boolean>{
    return await this.storage.exists({path: this.base});
  }
}

