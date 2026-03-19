import ExplorerFile from "../Explorer/file";
import ExplorerFolder from "../Explorer/folder";


export type PropsClassMainType = {name:string, ver?:number};

export type PropsClassAddNoteBD = {path:string, type:'file'|'folder'};

export type ReturnedErrorOrSucessExplorerType = {ok:false, error:string} | {ok:true, error:null};
export type ExplorerInfoData = { path:string; createdAt:number; updatedAt:number; extension?:string; };
export type ReturnedExplorerInfoType = {ok:false, error:string} | ({ok:true, error:null} & ExplorerInfoData);
export type ReturnedErrorExplorerType = {ok:false, error:string};
export type ReturnedExplorerFolderType = ReturnedErrorExplorerType | ExplorerFolder;
export type ReturnedExplorerFileType = ReturnedErrorExplorerType | ExplorerFile;

interface TableBuritiTypeBDBase {
  path: string;
  parent: string|null;
  createdAt: number;
  updatedAt: number;
};

interface TableBuritiTypeBDFolder extends TableBuritiTypeBDBase {
  type:'folder';
};

interface TableBuritiTypeBDFile extends TableBuritiTypeBDBase {
  type: 'file';
  extension?: string;
};

export type TableBuritiTypeBD = TableBuritiTypeBDFolder | TableBuritiTypeBDFile;



