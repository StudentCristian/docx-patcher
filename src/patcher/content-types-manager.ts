import { Element } from "xml-js";  
  
import { getFirstLevelElements } from "./util";  
  
export const appendContentType = (element: Element, contentType: string, extension: string): void => {  
    const relationshipElements = getFirstLevelElements(element, "Types");  
  
    // Para numbering, usar Override en lugar de Default  
    if (extension === "numbering") {  
        const existingOverride = relationshipElements.some(  
            (el) =>  
                el.type === "element" &&  
                el.name === "Override" &&  
                el?.attributes?.PartName === "/word/numbering.xml" &&  
                el?.attributes?.ContentType === contentType,  
        );  
          
        if (existingOverride) {  
            return;  
        }  
  
        // eslint-disable-next-line functional/immutable-data  
        relationshipElements.push({  
            attributes: {  
                PartName: "/word/numbering.xml",  
                ContentType: contentType,  
            },  
            name: "Override",  
            type: "element",  
        });  
    } else {  
        // Lógica existente para Default elements  
        const exist = relationshipElements.some(  
            (el) =>  
                el.type === "element" &&  
                el.name === "Default" &&  
                el?.attributes?.ContentType === contentType &&  
                el?.attributes?.Extension === extension,  
        );  
          
        if (exist) {  
            return;  
        }  
  
        // eslint-disable-next-line functional/immutable-data  
        relationshipElements.push({  
            attributes: {  
                ContentType: contentType,  
                Extension: extension,  
            },  
            name: "Default",  
            type: "element",  
        });  
    }  
};