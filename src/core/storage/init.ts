

import type { PropsClassMainType } from "../types/general";

export default class InitStorageIndexedDB {

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

  // ─── init ──────────────────────────────────────────────────

  protected openDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
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

  close(): void{
    this.db?.close();
    this.db = null;
  }
}

