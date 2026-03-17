import ExplorerFile from "../Explorer/file";
import ExplorerFolder from "../Explorer/folder";


export type PropsClassMainType = {name:string, ver?:number};

export type PropsClassAddNoteBD = {path:string, type:'file'|'folder'};

export type ReturnedErrorExplorerErrorType = {ok:boolean, error:string|null};
export type ReturnedErrorExplorerFolderType = ReturnedErrorExplorerErrorType | ExplorerFolder;
export type ReturnedErrorExplorerFileType = ReturnedErrorExplorerErrorType | ExplorerFile;

export interface TableBuritiTypeBD {
  path:string;
  parent:string;
  type:'file'|'folder';
  createdAt: number;
  updatedAt: number;
  size: number;
};



