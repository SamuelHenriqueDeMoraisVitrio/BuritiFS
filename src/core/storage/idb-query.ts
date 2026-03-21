
import type { ListItem, PropsClassMainType, TableBuritiTypeBD } from "../types/general";
import IDBNodes from "./idb-nodes";

export default class IDBQuery extends IDBNodes {

  constructor(props: PropsClassMainType) {
    super(props);
  }

  protected async existsNode({ path }: { path: string }): Promise<boolean> {
    const norm = await this.pathTrated(path);
    return !!norm.table;
  }

  protected async sizeNode({
    pathRef,
    recursive = false,
    filter,
  }: {
    pathRef: string;
    recursive?: boolean;
    filter?: (item: ListItem) => boolean;
  }): Promise<number> {

    const norm = await this.pathTrated(pathRef);
    if (!norm.table) throw new Error(`Path "${pathRef}" does not exist`);
    if (norm.table.type !== 'folder') throw new Error(`Path "${pathRef}" is not a folder`);

    return new Promise((resolve, reject) => {
      let count = 0;
      const transaction = this.db!.transaction('nodes', 'readonly');
      const store = transaction.objectStore('nodes');

      const recursiveRange = norm.path === '/'
        ? IDBKeyRange.lowerBound('/', true)
        : IDBKeyRange.bound(norm.path + '/', norm.path + '/' + '\uffff');

      const req: IDBRequest<IDBCursorWithValue | null> = recursive
        ? store.openCursor(recursiveRange)
        : store.index('parent').openCursor(IDBKeyRange.only(norm.path));

      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (!cursor) return;

        const node = cursor.value as TableBuritiTypeBD;
        const item: ListItem = {
          path: node.path,
          type: node.type,
          createdAt: node.createdAt,
          updatedAt: node.updatedAt,
        };

        if (!filter || filter(item)) count++;
        cursor.continue();
      };

      transaction.oncomplete = () => resolve(count);
      transaction.onerror = (e) => reject((e.target as IDBTransaction).error);
    });
  }

  protected async listNodes({
    pathRef,
    recursive = false,
    limit = -1,
    page = 0,
    filter,
  }: {
    pathRef: string;
    recursive?: boolean;
    limit?: number;
    page?: number;
    filter?: (item: ListItem) => boolean;
  }): Promise<ListItem[]> {

    const norm = await this.pathTrated(pathRef);
    if (!norm.table) throw new Error(`Path "${pathRef}" does not exist`);
    if (norm.table.type !== 'folder') throw new Error(`Path "${pathRef}" is not a folder`);

    return new Promise((resolve, reject) => {
      const results: ListItem[] = [];
      const transaction = this.db!.transaction('nodes', 'readonly');
      const store = transaction.objectStore('nodes');

      const recursiveRange = norm.path === '/'
        ? IDBKeyRange.lowerBound('/', true)
        : IDBKeyRange.bound(norm.path + '/', norm.path + '/' + '\uffff');

      const req: IDBRequest<IDBCursorWithValue | null> = recursive
        ? store.openCursor(recursiveRange)
        : store.index('parent').openCursor(IDBKeyRange.only(norm.path));

      let toSkip = limit === -1 ? 0 : page * limit;
      let count = 0;

      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (!cursor) return;

        const node = cursor.value as TableBuritiTypeBD;
        const item: ListItem = {
          path: node.path,
          type: node.type,
          createdAt: node.createdAt,
          updatedAt: node.updatedAt,
        };

        if (filter && !filter(item)) { cursor.continue(); return; }
        if (toSkip > 0) { toSkip--; cursor.continue(); return; }
        if (limit !== -1 && count >= limit) return;

        results.push(item);
        count++;

        if (limit !== -1 && count >= limit) return;
        cursor.continue();
      };

      transaction.oncomplete = () => resolve(results);
      transaction.onerror = (e) => reject((e.target as IDBTransaction).error);
    });
  }
}
