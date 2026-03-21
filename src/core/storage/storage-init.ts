
import type { PropsClassMainType, TableBuritiTypeBD } from "../types/general";
import IDBRefactor from "./idb-refactor";

export default class StorageInit extends IDBRefactor {

  constructor(props: PropsClassMainType) {
    super(props);
  }

  protected async initExplorerData(): Promise<void> {
    await this.openDB();
    await this.openStorage();
    await this.recover();
  }

  private async recover(): Promise<void> {
    await this.recoverPending();
    await this.recoverOrphans();
    await this.recoverBroken();
  }

  private async recoverPending(): Promise<void> {
    const pending = await this.request<TableBuritiTypeBD[]>(
      'readonly',
      store => store.index('status').getAll('pending')
    );

    for (const node of pending) {
      await this.removeNode({path:node.path});
      if (node.type === 'file') {
        await this.deleteStorage(node.contentId).catch(() => {});
      }
    }
  }

  private async recoverOrphans(): Promise<void> {
    for await (const [name, handle] of this.root as unknown as AsyncIterable<[string, FileSystemHandle]>) {
      if (handle.kind !== 'file') continue;
      const linked = await this.request<TableBuritiTypeBD | null>(
        'readonly',
        store => store.index('contentId').get(name)
      );
      if (!linked) {
        await this.deleteStorage(name).catch(() => {});
      }
    }
  }

  private async recoverBroken(): Promise<void> {
    const files = await this.request<TableBuritiTypeBD[]>(
      'readonly',
      store => store.index('type').getAll('file')
    );

    for (const node of files) {
      if (node.type !== 'file') continue;
      const exists = await this.existsStorage(node.contentId);
      if (!exists) {
        await this.removeNode({ path: node.path }).catch(() => {});
      }
    }
  }
}
