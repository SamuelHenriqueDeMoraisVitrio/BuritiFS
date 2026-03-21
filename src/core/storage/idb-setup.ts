

import type { PropsClassMainType, TableBuritiTypeBD } from "../types/general";
import validatePath from "../utils";

export default class IDBSetup {

  private static registry = new Map<string, IDBDatabase>();

  protected db: IDBDatabase | null = null;
  private dbName: string;
  private dbVersion: number;

  constructor({name, ver}:PropsClassMainType){
    this.dbName = name;
    this.dbVersion = ver ?? 1;
  }

  // ─── Helpers ───────────────────────────────────────────────

  protected request<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction("nodes", mode);
      const store = transaction.objectStore("nodes");
      const req = fn(store);
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject((e.target as IDBRequest).error);
    });
  }

  protected transact(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction("nodes", mode);
      const store = transaction.objectStore("nodes");
      fn(store);
      transaction.oncomplete = () => resolve();
      transaction.onerror = (e) => reject((e.target as IDBTransaction).error);
    });
  }

  protected async pathTrated(path:string):Promise<{path:string, parent:string|null, name:string, table:TableBuritiTypeBD|null}>{
    if(path === '/'){
      return {
        path,
        parent:null,
        name:path,
        table:await this.request<TableBuritiTypeBD|null>('readonly', store => store.get(path))
      }
    };


    const pathObj = {path};
    const err_validatePath = validatePath(pathObj);
    if(err_validatePath) throw new Error(err_validatePath);
    path = pathObj.path;

    const pathParts = path.split('/');
    const parent = pathParts.length === 2 ? '/' : pathParts.slice(0, -1).join('/');

    const parentNode = await this.request<TableBuritiTypeBD|null>('readonly', store => store.get(parent));
    if(!parentNode) throw new Error(`Parent path "${parent}" does not exist`);
    if(parentNode.type !== 'folder') throw new Error(`Parent path "${parent}" is not a folder`);

    const existingNode = await this.request<TableBuritiTypeBD|null>('readonly', store => store.get(path));

    return {path, parent, name:pathParts.pop() as string, table:existingNode};
  }

  // ─── init ──────────────────────────────────────────────────

  protected openDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        IDBSetup.registry.set(this.dbName, this.db);
        resolve();
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };

      request.onblocked = () => {
        reject(new Error('IndexedDB blocked: close other tabs that are using the database.'));
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const store = db.createObjectStore("nodes", { keyPath: "path" });
        store.createIndex("type", "type");
        store.createIndex("parent", "parent");
        store.createIndex("contentId", "contentId", { unique:true });
      };
    });
  }

  static close({name}:{name: string}): void {
    const db = IDBSetup.registry.get(name);
    if (db) {
      db.close();
      IDBSetup.registry.delete(name);
    }
  }
}

