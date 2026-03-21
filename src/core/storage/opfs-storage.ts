import { PropsClassMainType } from "../types/general";
import IDBSetup from "./idb-setup";


export default class OPFSStorage extends IDBSetup {
  protected root!: FileSystemDirectoryHandle;

  constructor(props: PropsClassMainType) {
    super(props);
  }

  protected async openStorage(){
    this.root = await navigator.storage.getDirectory();
    if (!this.root) throw new Error("Mensagem de erro");
  }

  protected async writeStorage(id: string, content: ArrayBuffer | string | object): Promise<void> {
    const fileHandle = await this.root.getFileHandle(id, { create: true });
    const writable = await fileHandle.createWritable();
    const data = typeof content === "object" && !(content instanceof ArrayBuffer)
      ? JSON.stringify(content)
      : content;
    await writable.write(data);
    await writable.close();
  }

  protected async readStorage(id: string): Promise<ArrayBuffer> {
    const fileHandle = await this.root.getFileHandle(id);
    const file = await fileHandle.getFile();
    return await file.arrayBuffer();
  }

  protected async readTextStorage(id: string): Promise<string> {
    const fileHandle = await this.root.getFileHandle(id);
    const file = await fileHandle.getFile();
    return await file.text();
  }

  protected async deleteStorage(id: string): Promise<void> {
    await this.root.removeEntry(id);
  }

  protected async existsStorage(id: string): Promise<boolean> {
    try {
      await this.root.getFileHandle(id);
      return true;
    } catch {
      return false;
    }
  }
}
