import { ParagraphChild } from "@file/paragraph";  
import { PatchType } from "./from-docx";  
  
export interface INestedListItem {  
    readonly content: readonly ParagraphChild[];  
    readonly children?: readonly INestedListItem[];  
    readonly level?: number;  
}  
  
// Crear una unión de tipos más específica  
export type ListChildren = readonly ParagraphChild[] | readonly INestedListItem[];  
  
export interface IListPatch {  
    readonly type: typeof PatchType.LIST;  
    readonly listType: "numbered" | "bullet";  
    readonly children: ListChildren; // Usar el tipo unión  
    readonly reference?: string;  
    readonly startNumber?: number;  
    readonly level?: number;  
    readonly nested?: boolean;  
}  
  
// Type guard para verificar si es una estructura anidada  
export function isNestedChildren(children: ListChildren): children is readonly INestedListItem[] {  
    return Array.isArray(children) &&   
           children.length > 0 &&   
           typeof children[0] === 'object' &&   
           'content' in children[0];  
}

export interface IListConfiguration {
    readonly reference: string;
    readonly listType: "numbered" | "bullet";
    readonly levels: readonly IListLevelConfig[];
}

export interface IListLevelConfig {
    readonly level: number;
    readonly format: "decimal" | "bullet" | "lowerLetter" | "upperLetter";
    readonly text?: string;
    readonly startNumber?: number;
}
