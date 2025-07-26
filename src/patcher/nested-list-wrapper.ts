import { BaseXmlComponent, IContext } from "@file/xml-components";  
import { IXmlableObject } from "@file/xml-components/xmlable-object";  
import { Paragraph } from "@file/paragraph";  
import { INestedListItem } from "./list-patch-types";  
  
export class NestedListItemWrapper extends BaseXmlComponent {  
    constructor(  
        private readonly item: INestedListItem,  
        private readonly reference: string,  
        private readonly currentLevel: number = 0  
    ) {  
        super("w:p");  
    }  
  
    public prepForXml(context: IContext): IXmlableObject | undefined {  
        // Crear un párrafo válido con numeración  
        const paragraph = new Paragraph({  
            children: this.item.content,  
            numbering: {  
                reference: this.reference,  
                level: this.item.level ?? this.currentLevel,  
                instance: 0  
            }  
        });  
  
        return paragraph.prepForXml(context);  
    }  
}  
  
export class NestedListWrapper extends BaseXmlComponent {  
    constructor(  
        private readonly items: readonly INestedListItem[],  
        private readonly reference: string,  
        private readonly startLevel: number = 0  
    ) {  
        super("w:document");  
    }  
  
    public prepForXml(context: IContext): IXmlableObject | undefined {  
        const elements: IXmlableObject[] = [];  
          
        for (const item of this.items) {  
            // Procesar el item actual  
            const wrapper = new NestedListItemWrapper(  
                item,   
                this.reference,   
                item.level ?? this.startLevel  
            );  
              
            const itemXml = wrapper.prepForXml(context);  
            if (itemXml) {  
                elements.push(itemXml);  
            }  
  
            // Procesar recursivamente los children  
            if (item.children && item.children.length > 0) {  
                const childWrapper = new NestedListWrapper(  
                    item.children,  
                    this.reference,  
                    (item.level ?? this.startLevel) + 1  
                );  
                  
                const childXml = childWrapper.prepForXml(context);  
                if (childXml && childXml[this.rootKey]) {  
                    // Extraer los elementos children y añadirlos directamente  
                    const childElements = Array.isArray(childXml[this.rootKey])   
                        ? childXml[this.rootKey]   
                        : [childXml[this.rootKey]];  
                    elements.push(...childElements);  
                }  
            }  
        }  
  
        return {  
            [this.rootKey]: elements  
        };  
    }  
}