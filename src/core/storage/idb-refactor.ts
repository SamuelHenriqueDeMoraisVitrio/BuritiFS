
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

      const newContentId = String(crypto.getRandomValues(new Uint32Array(1))[0]);
      const content = await this.readStorage(fromEntity.contentId);
      await this.writeStorage(newContentId, content);

      await this.transact('readwrite', store => {
        if (toEntityProps.table) store.delete(toEntityProps.path);
        store.put({
          path: toEntityProps.path,
          parent: toEntityProps.parent,
          type: 'file',
          contentId: newContentId,
          createdAt: fromEntity.createdAt,
          updatedAt: now,
          status: 'ready',
        } as TableBuritiTypeBD);
      });

      // Cleanup OPFS do arquivo substituído (referência já removida do IDB)
      if (toEntityProps.table?.type === 'file') {
        await this.deleteStorage(toEntityProps.table.contentId).catch(() => {});
      }
      return;
    }

    // ─── Folder ───────────────────────────────────────────────
    if (fromEntity.type === 'folder') {
      const destExists = !!toEntityProps.table;
      const destIsFile = toEntityProps.table?.type === 'file';

      if (priority === 'destination' && !merge && destExists) return;
      if (priority === 'destination' && destIsFile) return;

      const skipExisting = merge && priority === 'destination';
      const shouldReplaceDest = destExists && (!merge || destIsFile);

      // Coleta filhos da fonte
      const sourceRange = IDBKeyRange.bound(fromEntity.path + '/', fromEntity.path + '/' + '\uffff');
      const sourceChildren = await this.request<TableBuritiTypeBD[]>('readonly', store => store.getAll(sourceRange));

      // Coleta nós do destino que serão removidos (para cleanup do OPFS depois)
      let destNodesToClean: TableBuritiTypeBD[] = [];
      if (shouldReplaceDest) {
        if (destIsFile && toEntityProps.table) {
          destNodesToClean = [toEntityProps.table];
        } else {
          const destRange = IDBKeyRange.bound(toEntityProps.path + '/', toEntityProps.path + '/' + '\uffff');
          destNodesToClean = await this.request<TableBuritiTypeBD[]>('readonly', store => store.getAll(destRange));
        }
      }

      // Monta listas do que será criado
      type FolderToCreate = { path: string; parent: string | null; createdAt: number };
      type FileToCopy = { fromContentId: string; newContentId: string; newPath: string; newParent: string | null; createdAt: number };

      const foldersToCreate: FolderToCreate[] = [
        { path: toEntityProps.path, parent: toEntityProps.parent, createdAt: toEntityProps.table?.createdAt ?? now }
      ];
      const filesToCopy: FileToCopy[] = [];

      for (const node of sourceChildren) {
        if (node.status === 'pending') continue;
        const newPath = remap(node.path);
        const newParent = remapParent(node.parent);

        if (node.type === 'folder') {
          if (skipExisting && await this.existsNode({ path: newPath })) continue;
          foldersToCreate.push({ path: newPath, parent: newParent, createdAt: node.createdAt });
        } else if (node.type === 'file') {
          if (skipExisting && await this.existsNode({ path: newPath })) continue;
          filesToCopy.push({
            fromContentId: node.contentId,
            newContentId: String(crypto.getRandomValues(new Uint32Array(1))[0]),
            newPath,
            newParent,
            createdAt: node.createdAt,
          });
        }
      }

      // Passo 1: escreve novos arquivos no OPFS (IDB intocado)
      for (const file of filesToCopy) {
        const content = await this.readStorage(file.fromContentId);
        await this.writeStorage(file.newContentId, content);
      }

      // Passo 2: transact único para todas as mudanças no IDB
      await this.transact('readwrite', store => {
        if (shouldReplaceDest) {
          store.delete(toEntityProps.path);
          if (!destIsFile) {
            const destRange = IDBKeyRange.bound(toEntityProps.path + '/', toEntityProps.path + '/' + '\uffff');
            store.delete(destRange as unknown as IDBValidKey);
          }
        }

        for (const folder of foldersToCreate) {
          store.put({ path: folder.path, parent: folder.parent, type: 'folder', createdAt: folder.createdAt, updatedAt: now, status: 'ready' } as TableBuritiTypeBD);
        }

        for (const file of filesToCopy) {
          store.put({ path: file.newPath, parent: file.newParent, type: 'file', contentId: file.newContentId, createdAt: file.createdAt, updatedAt: now, status: 'ready' } as TableBuritiTypeBD);
        }
      });

      // Passo 3: cleanup OPFS antigo (referências já removidas do IDB)
      for (const node of destNodesToClean) {
        if (node.type === 'file') {
          await this.deleteStorage(node.contentId).catch(() => {});
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

        for (const node of children) {
          if (node.status === 'pending') continue;
          const newPath = remap(node.path);
          const newParent = remapParent(node.parent);
          store.delete(node.path);
          store.put({ ...node, path: newPath, parent: newParent, updatedAt: now });
        }
      });
    }
  }
}
