

import type { PropsClassMainType } from "../types/general";

import StorageIndexedDB from "../storage";

export default class ExplorerTree extends StorageIndexedDB {
  
  private constructor(props:PropsClassMainType){
    super(props);
  }

  static async create(props:PropsClassMainType):Promise<ExplorerTree>{
    const instance = new ExplorerTree(props);
    await instance.openDB();
    return instance;
  }

}



