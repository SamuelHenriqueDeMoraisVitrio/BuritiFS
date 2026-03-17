import ExplorerFile from "../Explorer/file";
import ExplorerFolder from "../Explorer/folder";


export type PropsClassMainType = {name:string, ver?:number};

export type PropsClassAddNoteBD = {path:string, type:'file'|'folder'};

export type ReturnedErrorExplorerType = {ok:false, error:string};
export type ReturnedExplorerFolderType = ReturnedErrorExplorerType | ExplorerFolder;
export type ReturnedExplorerFileType = ReturnedErrorExplorerType | ExplorerFile;

export interface TableBuritiTypeBD {
  path:string;
  parent:string;
  type:'file'|'folder';
  createdAt: number;
  updatedAt: number;
};



