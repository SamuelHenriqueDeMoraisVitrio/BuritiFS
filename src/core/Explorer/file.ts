


import StorageIndexedDB from "../storage/crud";

export default class ExplorerFile {
  private base:string;
  private storage:StorageIndexedDB;

  ok:boolean = true;
  error:string|null = null;

  constructor(base:string, storage:StorageIndexedDB){
    this.base = base;
    this.storage = storage;
  }
}

