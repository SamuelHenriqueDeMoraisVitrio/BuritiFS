


import type { ReturnedErrorOrSucessExplorerType } from "../types/general";
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

  async delete():Promise<ReturnedErrorOrSucessExplorerType>{
    return await this.storage.delete({path: this.base});
  }
}

