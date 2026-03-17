

import StorageIndexedDB from "../storage/crud";
import type { PropsClassMainType } from "../types/general";
import ExplorerFolder from "./folder";


export default class ExplorerTree extends StorageIndexedDB {

  private constructor(props:PropsClassMainType){
    super(props);
  }

  static async create(props:PropsClassMainType):Promise<ExplorerFolder>{
    const instance = new ExplorerTree(props);
    await instance.openDB();
    return new ExplorerFolder('/', instance);
  }

}



