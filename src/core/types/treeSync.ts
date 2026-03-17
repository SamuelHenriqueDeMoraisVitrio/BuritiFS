
export type FileContent = string | number | boolean | object | ArrayBuffer | Blob

export interface TreeSyncBase {
  ok: boolean;
  error: string | null;
}

interface TreeSyncEntity extends TreeSyncBase {
  path: string;
  delete: () => Promise<TreeSyncBase>;
}

export interface TreeSyncFolder extends TreeSyncEntity {
  list: (props?:{deep:boolean}) => Promise<string[]>;
  newFile: (props:string) => Promise<TreeSyncFile>;
  newFolder: (props:string) => Promise<TreeSyncFolder>;
  get: (props:string) => Promise<TreeSyncFolder | TreeSyncFile | TreeSyncBase>;
}

export interface TreeSyncFile extends TreeSyncEntity {
  write: (props:FileContent) => Promise<TreeSyncBase>;
  read: () => Promise<FileContent>;
}



