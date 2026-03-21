

import type { PropsClassAddNoteBD, PropsClassMainType, TableBuritiTypeBD } from "../types/general";
import OPFSStorage from "./opfs-storage";

export default class IDBNodes extends OPFSStorage {

  constructor(props: PropsClassMainType) {
    super(props);
  }

  protected async getSource(props: { path: string }): Promise<TableBuritiTypeBD> {
    const propsTrated = await this.pathTrated(props.path);
    if (!propsTrated.table) throw new Error(`Path ${props.path} does not exist`);
    return propsTrated.table;
  }

  protected async addNode({ path, type }: PropsClassAddNoteBD): Promise<void> {

    if (type !== 'file' && type !== 'folder') throw new Error("Type must be 'file' or 'folder'");
    if (path == '/') throw new Error("Should not create the root folder.");

    const propsTrated = await this.pathTrated(path);
    if (propsTrated.path === '/') throw new Error("Cannot add root node");
    if (propsTrated.table && propsTrated.table.type !== type) throw new Error(`Path "${path}" already exists as a "${propsTrated.table.type}"`);

    const now = Date.now();

    const contentId = type === 'file'
      ? String(crypto.getRandomValues(new Uint32Array(1))[0])
      : undefined;

    const node = {
      path: propsTrated.path,
      parent: propsTrated.parent,
      type,
      createdAt: propsTrated.table?.createdAt ?? now,
      updatedAt: now,
      ...(contentId ? { contentId } : {})
    } as TableBuritiTypeBD;

    await this.withWAL(node, async () => {
      if (type === 'file') await this.writeStorage(contentId!, "");
    });
  }

  protected async removeNode({ path }: { path: string }): Promise<void> {
    if (path === '/') throw new Error('Cannot remove root node.');
    const node = await this.getSource({ path });

    if (node.type === 'file') {
      await this.transact("readwrite", store => store.delete(node.path));
      await this.deleteStorage(node.contentId).catch(() => {});
      return;
    }

    if (node.type === 'folder') {
        // Busca todos os arquivos filhos para deletar do OPFS
      const range = IDBKeyRange.bound(node.path + '/', node.path + '/' + '\uffff');
      const children = await this.request<TableBuritiTypeBD[]>('readonly', store => store.getAll(range));

      await this.transact("readwrite", store => {
        store.delete(range);
        store.delete(node.path);
      });

      for (const child of children) {
        if (child.type === 'file') {
          await this.deleteStorage(child.contentId).catch(() => {});
        }
      }
      return;
    }

    throw new Error(`Unknown node type "${(node as TableBuritiTypeBD).type}" at path "${path}".`);
  }
}
