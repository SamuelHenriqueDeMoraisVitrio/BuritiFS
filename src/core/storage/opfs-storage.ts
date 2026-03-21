import { PropsClassMainType } from "../types/general";
import IDBSetup from "./idb-setup";


export default class OPFSStorage extends IDBSetup {
  private root: FileSystemDirectoryHandle; // sem null

  private constructor(props: PropsClassMainType, root: FileSystemDirectoryHandle) {
    super(props);
    this.root = root;
  }

  static async init(props: PropsClassMainType): Promise<OPFSStorage> {
    const root = await navigator.storage.getDirectory();
    return new OPFSStorage(props, root);
  }

  async write(id: string, content: ArrayBuffer | string | object): Promise<void> {
    const fileHandle = await this.root.getFileHandle(id, { create: true });
    const writable = await fileHandle.createWritable();
    const data = typeof content === "object" && !(content instanceof ArrayBuffer)
      ? JSON.stringify(content)
      : content;
    await writable.write(data);
    await writable.close();
  }

  async read(id: string): Promise<ArrayBuffer> {
    const fileHandle = await this.root.getFileHandle(id);
    const file = await fileHandle.getFile();
    return await file.arrayBuffer();
  }

  async readText(id: string): Promise<string> {
    const fileHandle = await this.root.getFileHandle(id);
    const file = await fileHandle.getFile();
    return await file.text();
  }

  async delete(id: string): Promise<void> {
    await this.root.removeEntry(id);
  }

  async exists(id: string): Promise<boolean> {
    try {
      await this.root.getFileHandle(id);
      return true;
    } catch {
      return false;
    }
  }
}
