



import { PropsClassAddNoteBD, PropsClassMainType, TableBuritiTypeBD } from "../types/general";
import validatePath from "../utils";
import InitStorageIndexedDB from "./init";

export default class StorageIndexedDB extends InitStorageIndexedDB {

  constructor(props:PropsClassMainType){
    super(props);
  }

  async addNode({path, type}:PropsClassAddNoteBD):Promise<void>{

    const err_validatePath = validatePath({path});
    if(err_validatePath) throw new Error(err_validatePath);
    if(path === '/') throw new Error("Cannot add root node");
    if(type !== 'file' && type !== 'folder') throw new Error("Type must be 'file' or 'folder'");

    const pathParts = path.split('/');
    const parent = pathParts.length === 2 ? '/' : pathParts.slice(0, -1).join('/');

    const parentNode = await this.request<TableBuritiTypeBD|null>('readonly', store => store.get(parent));
    if(!parentNode) throw new Error(`Parent path "${parent}" does not exist`);
    if(parentNode.type !== 'folder') throw new Error(`Parent path "${parent}" is not a folder`);

    const existingNode = await this.request<TableBuritiTypeBD|null>('readonly', store => store.get(path));
    if(existingNode && existingNode.type !== type) throw new Error(`Path "${path}" already exists as a "${existingNode.type}"`);

    const now = Date.now();

    await this.transact("readwrite", (store) => {
      store.put({
        path,
        parent,
        type,
        createdAt: existingNode ? existingNode.createdAt : now,
        updatedAt: now
      });
    });
  }

}


