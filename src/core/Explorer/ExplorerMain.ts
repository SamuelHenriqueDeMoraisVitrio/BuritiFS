

import StorageInit from "../storage/storage-init";
import type { ListItem, PropsClassMainType, ReturnedErrorExplorerType, ReturnedErrorOrSucessExplorerType, ReturnedExplorerFileType, ReturnedExplorerFolderType, ReturnedExplorerInfoType, ReturnedExplorerListType, ReturnedExplorerReadType, ReturnedExplorerSizeType, TableBuritiTypeBD } from "../types/general";
import ExplorerFile from "./file";
import ExplorerFolder from "./folder";


export default class ExplorerTree extends StorageInit {

  private listeners: Map<string, Set<() => void>> = new Map();

  private constructor(props:PropsClassMainType){
    super(props);
  }

  subscribe(path: string, fn: () => void): () => void {
    if (!this.listeners.has(path)) this.listeners.set(path, new Set());
    this.listeners.get(path)!.add(fn);
    return () => this.listeners.get(path)?.delete(fn);
  }

  private parentOf(path: string): string {
    const idx = path.lastIndexOf('/');
    if (idx <= 0) return '/';
    return path.slice(0, idx);
  }

  private notify(path: string): void {
    let current: string | null = path;
    while (current !== null) {
      this.listeners.get(current)?.forEach(fn => fn());
      if (current === '/') break;
      current = this.parentOf(current);
    }
  }

  static async create(props:PropsClassMainType):Promise<ExplorerTree | ReturnedErrorExplorerType>{
    const instance = new ExplorerTree(props);
    try {
      await instance.initExplorerData();
      const now = Date.now();
      const existing = await instance.request<{ createdAt: number } | null>('readonly', store => store.get('/'));
      const objectPathRootInitialize:TableBuritiTypeBD = {
          path:'/',
          type:'folder',
          parent:null,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          status: "ready"
        }
      await instance.transact("readwrite", (store) => store.put(objectPathRootInitialize));
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
    return instance;
  }

  // ─── Get ──────────────────────────────────────────────────

  async source({path}:{path:string}):Promise<ReturnedExplorerFileType | ReturnedExplorerFolderType>{
    try {
      const table = await this.getSource({path});
      if(table.type === 'folder') return new ExplorerFolder(table.path, this);
      if(table.type === 'file') return new ExplorerFile(table.path, this);
      return {ok:false, error:`Internal error: entity at "${path}" has no valid type`};
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
  }

  // ─── Info ─────────────────────────────────────────────────

  async info({path}:{path:string}):Promise<ReturnedExplorerInfoType>{
    try {
      const table = await this.getSource({path});
      return {ok:true, error:null, path:table.path, createdAt:table.createdAt, updatedAt:table.updatedAt};
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
  }

  async type({path}:{path:string}):Promise<string|null>{
    try {
      const entity = await this.getSource({path});
      return entity.path === '/' ? 'folder' : entity.type;
    } catch (e) {
      return null;
    }
  }

  // ─── New ──────────────────────────────────────────────────
  
  async newFolder({path}:{path:string}):Promise<ReturnedExplorerFolderType>{
    try {
      await this.addNode({path, type:'folder'});
      this.notify(this.parentOf(path));
      return new ExplorerFolder(path, this);
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
  }

  async newFile({path}:{path:string}):Promise<ReturnedExplorerFileType>{
    try {
      await this.addNode({path, type:'file'});
      this.notify(this.parentOf(path));
      return new ExplorerFile(path, this);
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
  }

  // ─── Refactor ─────────────────────────────────────────────
  
  async delete({path}:{path:string}):Promise<ReturnedErrorOrSucessExplorerType>{
    try {
      const parent = this.parentOf(path);
      await this.removeNode({path});
      this.notify(parent);
      return {ok:true, error:null};
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
  }

  async copy({fromPath, toPath, merge, priority}:{fromPath:string, toPath:string, merge?:boolean, priority?:'source'|'destination'}):Promise<ReturnedErrorOrSucessExplorerType>{
    try {
      await this.copyNode({fromPath, toPath, merge, priority});
      this.notify(this.parentOf(toPath));
      return {ok:true, error:null};
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
  }

  async move({fromPath, toPath, force}:{fromPath:string, toPath:string, force?:boolean}):Promise<ReturnedErrorOrSucessExplorerType>{
    try {
      await this.moveNode({fromPath, toPath, force});
      this.notify(this.parentOf(fromPath));
      this.notify(this.parentOf(toPath));
      return {ok:true, error:null};
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
  }

  async rename({path, name}:{path:string, name:string}):Promise<ReturnedErrorOrSucessExplorerType>{
    try {
      const normalized = await this.pathTrated(path);
      const parent = normalized.parent ?? '/';
      const toPath = `${parent === '/' ? '' : parent}/${name}`;
      await this.moveNode({fromPath: normalized.path, toPath});
      this.notify(parent);
      return {ok:true, error:null};
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
  }

  async list({path, recursive, limit, page, filter}:{path:string, recursive?:boolean, limit?:number, page?:number, filter?:(item:ListItem)=>boolean}):Promise<ReturnedExplorerListType>{
    try {
      const items = await this.listNodes({pathRef: path, recursive, limit, page, filter});
      return {ok:true, error:null, items};
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
  }

  async exists({path}:{path:string}):Promise<boolean>{
    try {
      return await this.existsNode({path});
    } catch {
      return false;
    }
  }

  async size({path, recursive, filter}:{path:string, recursive?:boolean, filter?:(item:ListItem)=>boolean}):Promise<ReturnedExplorerSizeType>{
    try {
      const size = await this.sizeNode({pathRef: path, recursive, filter});
      return {ok:true, error:null, size};
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
  }

  async write({path, content}:{path:string, content: ArrayBuffer | string | object}):Promise<ReturnedErrorOrSucessExplorerType>{
    try {
      const tableByDB = await this.getSource({path});
      if (tableByDB.type === 'folder') return {ok: false, error: `Path "${path}" is a folder`};
      await this.writeStorage(tableByDB.contentId, content);
      await this.transact('readwrite', store => store.put({...tableByDB, updatedAt: Date.now()}));
      this.notify(path);
      return {ok:true, error:null};
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
  }

  async read({path}:{path:string}):Promise<ReturnedExplorerReadType>{
    try {
      const tableByDB = await this.getSource({path});
      if (tableByDB.type === 'folder') return {ok:false, error:`Path "${path}" is a folder`};
      const content = await this.readStorage(tableByDB.contentId);
      const text = new TextDecoder().decode(content);
      return {ok:true, error:null, content, text};
    } catch (e) {
      return {ok:false, error:e instanceof Error ? e.message : String(e)};
    }
  }

  // zip. Talvez futuramente.
  // Sync Github. Talvez futuramente.
}



