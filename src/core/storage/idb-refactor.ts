
import type { PropsClassMainType, TableBuritiTypeBD } from "../types/general";
import IDBQuery from "./idb-query";

export default class IDBRefactor extends IDBQuery {

  constructor(props: PropsClassMainType) {
    super(props);
  }

  protected async copyNode({
    fromPath,
    toPath,
    merge = false,
    priority = 'source',
  }: {
    fromPath: string;
    toPath: string;
    merge?: boolean;
    priority?: 'source' | 'destination';
  }): Promise<void> {

    if (fromPath === '/' || toPath === '/') throw new Error('Cannot copy root node.');
    if (fromPath === toPath) throw new Error('Cannot copy a node to itself.');

    const fromEntity = await this.getSource({ path: fromPath });
    const toEntityProps = await this.pathTrated(toPath);

    const now = Date.now();
    const remap = (oldPath: string) => toEntityProps.path + oldPath.slice(fromEntity.path.length);
    const remapParent = (oldParent: string | null): string | null =>
      oldParent === null
        ? null
        : oldParent === fromEntity.path
          ? toEntityProps.path
          : remap(oldParent);

    // ─── File ─────────────────────────────────────────────────
    if (fromEntity.type === 'file') {
      if (priority === 'destination' && !!toEntityProps.table) return;
      if (!!toEntityProps.table) await this.removeNode({ path: toEntityProps.path });

      const newContentId = String(crypto.getRandomValues(new Uint32Array(1))[0]);
      const content = await this.readStorage(fromEntity.contentId);

      await this.withWAL(
        {
          path: toEntityProps.path,
          parent: toEntityProps.parent,
          type: 'file',
          contentId: newContentId,
          createdAt: fromEntity.createdAt,
          updatedAt: now,
        } as TableBuritiTypeBD,
        async () => await this.writeStorage(newContentId, content)
      );
      return;
    }

    // ─── Folder ───────────────────────────────────────────────
    if (fromEntity.type === 'folder') {
      const destIsFile = toEntityProps.table?.type === 'file';
      const destExists = !!toEntityProps.table;

      if (priority === 'destination') {
        if (!merge && destExists) return;
        if (destIsFile) return;
      }

      if (destExists && (!merge || destIsFile)) {
        await this.removeNode({ path: toEntityProps.path });
      }

      await this.addNode({ path: toEntityProps.path, type: 'folder' });

      const range = IDBKeyRange.bound(fromEntity.path + '/', fromEntity.path + '/' + '\uffff');
      const skipExisting = merge && priority === 'destination';

      // Busca todos os filhos para poder duplicar arquivos no OPFS
      const children = await this.request<TableBuritiTypeBD[]>('readonly', store => store.getAll(range));

      for (const node of children) {
        if (node.status === 'pending') continue;
        const newPath = remap(node.path);
        const newParent = remapParent(node.parent);

        if (node.type === 'folder') {
          if (skipExisting) {
            const exists = await this.existsNode({ path: newPath });
            if (!exists) await this.addNode({ path: newPath, type: 'folder' });
          } else {
            await this.addNode({ path: newPath, type: 'folder' });
          }
          continue;
        }

        if (node.type === 'file') {
          if (skipExisting) {
            const exists = await this.existsNode({ path: newPath });
            if (exists) continue;
          }

          const newContentId = String(crypto.getRandomValues(new Uint32Array(1))[0]);
          const content = await this.readStorage(node.contentId);

          await this.withWAL(
            {
              path: newPath,
              parent: newParent,
              type: 'file',
              contentId: newContentId,
              createdAt: node.createdAt,
              updatedAt: now,
            } as TableBuritiTypeBD,
            async () => await this.writeStorage(newContentId, content)
          );
        }
      }
    }
  }

  protected async moveNode({
    fromPath,
    toPath,
    force = false,
  }: {
    fromPath: string;
    toPath: string;
    force?: boolean;
  }): Promise<void> {
    if (fromPath === '/' || toPath === '/') throw new Error('Cannot move root node.');
    const fromNorm = await this.pathTrated(fromPath);
    const toNorm = await this.pathTrated(toPath);
    if (fromNorm.path === toNorm.path) throw new Error('Cannot move a node to itself.');
    if (toNorm.path.startsWith(fromNorm.path + '/')) throw new Error('Cannot move a folder into one of its own descendants.');

    const fromEntity = await this.getSource({ path: fromPath });
    const destExists = !!toNorm.table;

    if (destExists) {
      if (!force) throw new Error(`Destination "${toNorm.path}" already exists.`);
      await this.removeNode({ path: toNorm.path });
    }

    const now = Date.now();
    const remap = (oldPath: string) => toNorm.path + oldPath.slice(fromNorm.path.length);
    const remapParent = (oldParent: string | null): string | null =>
      oldParent === null
        ? null
        : oldParent === fromNorm.path
          ? toNorm.path
          : remap(oldParent);

    if (fromEntity.type === 'file') {
      await this.transact('readwrite', store => {
        store.delete(fromNorm.path);
        store.put({ ...fromEntity, path: toNorm.path, parent: toNorm.parent, updatedAt: now });
      });
      return;
    }

    if (fromEntity.type === 'folder') {
      const range = IDBKeyRange.bound(fromNorm.path + '/', fromNorm.path + '/' + '\uffff');
      const children = await this.request<TableBuritiTypeBD[]>('readonly', store => store.getAll(range));

      await this.transact('readwrite', store => {
        store.delete(fromNorm.path);
        store.put({ ...fromEntity, path: toNorm.path, parent: toNorm.parent, updatedAt: now });
      });

      for (const node of children) {
        if (node.status === 'pending') continue;
        const newPath = remap(node.path);
        const newParent = remapParent(node.parent);

        await this.transact('readwrite', store => {
          store.delete(node.path);
          store.put({ ...node, path: newPath, parent: newParent, updatedAt: now });
        });
      }
    }
  }
}
