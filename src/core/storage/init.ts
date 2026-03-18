

import type { PropsClassAddNoteBD, PropsClassMainType, TableBuritiTypeBD } from "../types/general";
import validatePath from "../utils";

export default class InitStorageIndexedDB {

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

  protected async pathTrated({path, type}:PropsClassAddNoteBD):Promise<{path:string, parent:string|null, name:string, table:TableBuritiTypeBD|null}>{
    if(path === '/'){
      if(type == 'file') throw new Error("Type must be 'folder'");
      return {
        path,
        parent:null,
        name:path,
        table:await this.request<TableBuritiTypeBD|null>('readonly', store => store.get(path))
      }
    };

    if(type !== 'file' && type !== 'folder') throw new Error("Type must be 'file' or 'folder'");

    const err_validatePath = validatePath({path});
    if(err_validatePath) throw new Error(err_validatePath);

    const pathParts = path.split('/');
    const parent = pathParts.length === 2 ? '/' : pathParts.slice(0, -1).join('/');

    const parentNode = await this.request<TableBuritiTypeBD|null>('readonly', store => store.get(parent));
    if(!parentNode) throw new Error(`Parent path "${parent}" does not exist`);
    if(parentNode.type !== 'folder') throw new Error(`Parent path "${parent}" is not a folder`);

    const existingNode = await this.request<TableBuritiTypeBD|null>('readonly', store => store.get(path));
    if(existingNode && existingNode.type !== type) throw new Error(`Path "${path}" already exists as a "${existingNode.type}"`);

    return {path, parent, name:pathParts.pop() as string, table:existingNode};
  }

  // ─── init ──────────────────────────────────────────────────

  protected openDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        InitStorageIndexedDB.registry.set(this.dbName, this.db);
        resolve();
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };

      request.onblocked = () => {
        reject(new Error('IndexedDB blocked: close other tabs that are using the database.'));
      };

      /*
       * path:string => '/boot/efi/sla.txt';
       * type:string<'file'|'folder'> => 'file';
       * parent:string => '/boot/efi';
       * createdAt:number<Date> => 88564;
       * updatedAt:number<Date> => 88564;
      */
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const store = db.createObjectStore("nodes", { keyPath: "path" })
        store.createIndex("type", "type")
        store.createIndex("parent", "parent")
      };
    });
  }

  static close(name: string): void {
    const db = InitStorageIndexedDB.registry.get(name);
    if (db) {
      db.close();
      InitStorageIndexedDB.registry.delete(name);
    }
  }
}

