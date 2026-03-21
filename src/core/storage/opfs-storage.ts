import { PropsClassMainType } from "../types/general";
import IDBSetup from "./idb-setup";


//const root = await navigator.storage.getDirectory();
export default class OPFSStorage extends IDBSetup {
  private root: FileSystemDirectoryHandle; // sem null

  constructor(props: PropsClassMainType) {
    super(props);
    this.root = props.rootOPFS;
    if (!this.root) throw new Error("Mensagem de erro");
  }

  protected async write(id: string, content: ArrayBuffer | string | object): Promise<void> {
    const fileHandle = await this.root.getFileHandle(id, { create: true });
    const writable = await fileHandle.createWritable();
    const data = typeof content === "object" && !(content instanceof ArrayBuffer)
      ? JSON.stringify(content)
      : content;
    await writable.write(data);
    await writable.close();
  }

  protected async read(id: string): Promise<ArrayBuffer> {
    const fileHandle = await this.root.getFileHandle(id);
    const file = await fileHandle.getFile();
    return await file.arrayBuffer();
  }

  protected async readText(id: string): Promise<string> {
    const fileHandle = await this.root.getFileHandle(id);
    const file = await fileHandle.getFile();
    return await file.text();
  }

  protected async delete(id: string): Promise<void> {
    await this.root.removeEntry(id);
  }

  protected async exists(id: string): Promise<boolean> {
    try {
      await this.root.getFileHandle(id);
      return true;
    } catch {
      return false;
    }
  }
}
