


import type { ReturnedErrorOrSucessExplorerType, ReturnedExplorerFileType } from "../types/general";
import type ExplorerTree from "./ExplorerMain";

export default class ExplorerFile {
  private base:string;
  private storage:ExplorerTree;

  readonly ok:true = true;
  readonly error:null = null;

  constructor(base:string, storage:ExplorerTree){
    this.base = base;
    this.storage = storage;
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

  async move({to, merge, priority}:{to:string, merge?:boolean, priority?:'source'|'destination'}):Promise<ReturnedErrorOrSucessExplorerType>{
    const result = await this.storage.move({fromPath: this.base, toPath: to, merge, priority});
    if (!result.ok) return result;
    const newInstance = await this.storage.source({path: to});
    if (newInstance instanceof ExplorerFile) this.base = newInstance.base;
    return {ok:true, error:null};
  }

  async delete():Promise<ReturnedErrorOrSucessExplorerType>{
    return await this.storage.delete({path: this.base});
  }
}

