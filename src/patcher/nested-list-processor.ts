import { Paragraph } from "@file/paragraph";  
import { INestedListItem } from "./list-patch-types";  
  
export class NestedListProcessor {  
    /**  
     * Aplana una estructura jerárquica de listas anidadas en una secuencia lineal  
     * manteniendo la información de nivel para cada párrafo  
     */  
    public static flattenNestedStructure(  
        items: readonly INestedListItem[],   
        baseReference: string,  
        startLevel = 0  
    ): Array<{paragraph: Paragraph, level: number}> {  
        const flattened: Array<{paragraph: Paragraph, level: number}> = [];  
          
        for (const item of items) {  
            // Añadir el item actual  
            const paragraph = new Paragraph({  
                children: item.content,  
                numbering: {  
                    reference: baseReference,  
                    level: item.level ?? startLevel,  
                    instance: 0  
                }  
            });  
              
            flattened.push({  
                paragraph,  
                level: item.level ?? startLevel  
            });  
              
            // Procesar recursivamente los children  
            if (item.children && item.children.length > 0) {  
                const childItems = this.flattenNestedStructure(  
                    item.children,   
                    baseReference,   
                    startLevel + 1  
                );  
                flattened.push(...childItems);  
            }  
        }  
          
        return flattened;  
    }  
  
    /**  
     * Detecta la profundidad máxima de una estructura anidada  
     */  
    public static detectMaxDepth(  
        items: readonly INestedListItem[],   
        currentDepth = 0  
    ): number {  
        let maxDepth = currentDepth;  
          
        for (const item of items) {  
            if (item.children && item.children.length > 0) {  
                const childDepth = this.detectMaxDepth(item.children, currentDepth + 1);  
                maxDepth = Math.max(maxDepth, childDepth);  
            }  
        }  
          
        return maxDepth;  
    }  
  
    /**  
     * Valida que una estructura anidada sea válida  
     */  
    public static validateNestedStructure(items: readonly INestedListItem[]): boolean {  
        for (const item of items) {  
            // Validar que el contenido no esté vacío  
            if (!item.content || item.content.length === 0) {  
                return false;  
            }  
              
            // Validar recursivamente los children  
            if (item.children && item.children.length > 0) {  
                if (!this.validateNestedStructure(item.children)) {  
                    return false;  
                }  
            }  
              
            // Validar que el nivel no sea negativo  
            if (item.level !== undefined && item.level < 0) {  
                return false;  
            }  
        }  
          
        return true;  
    }  
}