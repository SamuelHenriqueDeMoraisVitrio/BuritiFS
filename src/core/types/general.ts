

export type PropsClassMainType = {name:string, ver?:number};

export type PropsClassAddNoteBD = {path:string, type:'file'|'folder'};

export interface TableBuritiTypeBD {
  path:string;
  parent:string;
  type:'file'|'folder';
  createdAt: number;
  updatedAt: number;
  size: number;
};



