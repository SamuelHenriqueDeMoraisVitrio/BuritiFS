
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

    const recursiveRange = norm.path === '/'
      ? IDBKeyRange.lowerBound('/', true)
      : IDBKeyRange.bound(norm.path + '/', norm.path + '/' + '\uffff');

    let count:number = 0;
    await this.transact('readonly', store => {
      const req = recursive
        ? store.openCursor(recursiveRange)
        : store.index('parent').openCursor(IDBKeyRange.only(norm.path));

      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (!cursor) return;
        const node = cursor.value as TableBuritiTypeBD;
        if (node.status !== 'pending') {
          const item: ListItem = { path: node.path, type: node.type, createdAt: node.createdAt, updatedAt: node.updatedAt };
          if (!filter || filter(item)) count++;
        }
        cursor.continue();
      };
    });

    return count;
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

    const recursiveRange = norm.path === '/'
      ? IDBKeyRange.lowerBound('/', true)
      : IDBKeyRange.bound(norm.path + '/', norm.path + '/' + '\uffff');

    const results: ListItem[] = [];
    let toSkip = limit === -1 ? 0 : page * limit;
    let count = 0;

    await this.transact('readonly', (store => {
      const req: IDBRequest<IDBCursorWithValue | null> = recursive
        ? store.openCursor(recursiveRange)
        : store.index('parent').openCursor(IDBKeyRange.only(norm.path));

      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (!cursor) return;

        const node = cursor.value as TableBuritiTypeBD;

        if (node.status === 'pending') {
          cursor.continue();
          return;
        }

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
        cursor.continue();
      }
    }));

    return results;
  }
}
