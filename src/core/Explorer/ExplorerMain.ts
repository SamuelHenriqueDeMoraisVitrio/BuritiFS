

import StorageIndexedDB from "../storage/crud";
import type { PropsClassMainType } from "../types/general";


export default class ExplorerTree extends StorageIndexedDB {

  private base:string = '/';
  
  private constructor(props:PropsClassMainType){
    super(props);
  }

  static async create(props:PropsClassMainType):Promise<ExplorerTree>{
    const instance = new ExplorerTree(props);
    await instance.openDB();
    return instance;
  }

  // ─── New ──────────────────────────────────────────────────
  
  async newFile(path:string){
  }

  async newFolder(name:string){
    try {
      await this.addNode({path:this.base+name, type:'folder'});
      return {ok:true, error:null}; // Eu não sei o que fazer para retornar o ExplorerTree somente com as funções responsaveis pelo folder e a base nova;
    } catch (e) {
      return {ok:false, error:e};
    }
  }

}



