import xml from "xml";  
import { Element } from "xml-js";  
  
import { Formatter } from "@export/formatter";  
import { IContext, XmlComponent } from "@file/xml-components";  
  
import { IPatch, PatchType } from "./from-docx";  
import { findRunElementIndexWithToken, splitRunElement } from "./paragraph-split-inject";  
import { replaceTokenInParagraphElement } from "./paragraph-token-replacer";  
import { findLocationOfText } from "./traverser";  
import { toJson } from "./util";  
import { Paragraph } from "@file/paragraph";   
  
const formatter = new Formatter();  
  
const SPLIT_TOKEN = "ɵ";  
  
type IReplacerResult = {  
    readonly element: Element;  
    readonly didFindOccurrence: boolean;  
};  
  
export const replacer = ({
    json,
    patch,
    patchText,
    context,
    keepOriginalStyles = true,
    numberingReferenceMap,
}: {
    readonly json: Element;
    readonly patch: IPatch;
    readonly patchText: string;
    readonly context: IContext;
    readonly keepOriginalStyles?: boolean;
    readonly numberingReferenceMap?: Map<string, string>;
}): IReplacerResult => {
    // Función helper mejorada para extraer texto real de párrafos  
    const extractTextFromChild = (child: any): string => {  
        if (child instanceof Paragraph) {  
            try {  
                // Usar el formatter para convertir a XML  
                const xmlString = xml(formatter.format(child as XmlComponent, context));  
                const parsedXml = toJson(xmlString);  
                  
                // Usar el sistema de renderizado existente para extraer texto  
                if (parsedXml.elements && parsedXml.elements[0]) {  
                    const paragraphElement = parsedXml.elements[0];  
                    const extractedText = extractTextFromParagraphElement(paragraphElement);  
                    return extractedText || "List item"; // Fallback explícito  
                }  
            } catch (error) {  
                console.warn('Error extracting text from paragraph:', error);  
                // Log más detallado para debugging  
                console.debug('Failed paragraph:', child);  
            }  
        }  
          
        return "List item";  
    };  
  
    // Función helper que usa lógica similar al run-renderer  
    const extractTextFromParagraphElement = (paragraphElement: any): string => {  
        let text = '';  
          
        if (!paragraphElement.elements) {  
            return "List item";  
        }  
          
        // Buscar elementos w:r (runs) dentro del párrafo  
        for (const element of paragraphElement.elements) {  
            if (element.name === 'w:r' && element.elements) {  
                // Buscar elementos w:t dentro del run  
                for (const runElement of element.elements) {  
                    if (runElement.name === 'w:t' && runElement.elements) {  
                        for (const textNode of runElement.elements) {  
                            if (textNode.type === 'text' && textNode.text) {  
                                text += textNode.text;  
                            }  
                        }  
                    }  
                }  
            }  
        }  
          
        return text.trim() || "List item";  
    };  
  
    const renderedParagraphs = findLocationOfText(json, patchText);  
  
    if (renderedParagraphs.length === 0) {  
        return { element: json, didFindOccurrence: false };  
    }  
  
    for (const renderedParagraph of renderedParagraphs) {  
        const textJson = patch.children.map((c) => toJson(xml(formatter.format(c as XmlComponent, context)))).map((c) => c.elements![0]);  
  
        switch (patch.type) {  
            case PatchType.DOCUMENT: {  
                const parentElement = goToParentElementFromPath(json, renderedParagraph.pathToParagraph);  
                const elementIndex = getLastElementIndexFromPath(renderedParagraph.pathToParagraph);  
                // eslint-disable-next-line functional/immutable-data  
                parentElement.elements!.splice(elementIndex, 1, ...textJson);  
                break;  
            }  
            case PatchType.LIST: {  
                // Usar la referencia real del NumberingManager
                const parentElement = goToParentElementFromPath(json, renderedParagraph.pathToParagraph);
                const elementIndex = getLastElementIndexFromPath(renderedParagraph.pathToParagraph);

                // Obtener la referencia real del mapa, usando el patchText (sin llaves)
                const actualReference = numberingReferenceMap?.get(patchText.replace(/[{}]/g, "")) || patch.reference || `${patch.listType}-ref-1`;

                const xmlElements = patch.children.map((child) => {
                    if (child instanceof Paragraph) {
                        const paragraphWithNumbering = new Paragraph({
                            text: extractTextFromChild(child),
                            numbering: {
                                reference: actualReference,
                                level: patch.level || 0,
                                instance: 0
                            }
                        });
                        return toJson(xml(formatter.format(paragraphWithNumbering as XmlComponent, context))).elements![0];
                    }
                    return toJson(xml(formatter.format(child as XmlComponent, context))).elements![0];
                });

                parentElement.elements!.splice(elementIndex, 1, ...xmlElements);
                break;
            }  
            case PatchType.PARAGRAPH:  
            default: {  
                const paragraphElement = goToElementFromPath(json, renderedParagraph.pathToParagraph);  
                replaceTokenInParagraphElement({  
                    paragraphElement,  
                    renderedParagraph,  
                    originalText: patchText,  
                    replacementText: SPLIT_TOKEN,  
                });  
  
                const index = findRunElementIndexWithToken(paragraphElement, SPLIT_TOKEN);  
  
                const runElementToBeReplaced = paragraphElement.elements![index];  
                const { left, right } = splitRunElement(runElementToBeReplaced, SPLIT_TOKEN);  
  
                let newRunElements = textJson;  
                let patchedRightElement = right;  
  
                if (keepOriginalStyles) {  
                    const runElementNonTextualElements = runElementToBeReplaced.elements!.filter(  
                        (e) => e.type === "element" && e.name === "w:rPr",  
                    );  
  
                    newRunElements = textJson.map((e) => ({  
                        ...e,  
                        elements: [...runElementNonTextualElements, ...(e.elements ?? [])],  
                    }));  
  
                    patchedRightElement = {  
                        ...right,  
                        elements: [...runElementNonTextualElements, ...right.elements!],  
                    };  
                }  
  
                // eslint-disable-next-line functional/immutable-data  
                paragraphElement.elements!.splice(index, 1, left, ...newRunElements, patchedRightElement);  
                break;  
            }  
        }  
    }  
  
    return { element: json, didFindOccurrence: true };  
};  
  
const goToElementFromPath = (json: Element, path: readonly number[]): Element => {  
    let element = json;  
  
    // We start from 1 because the first element is the root element  
    // Which we do not want to double count  
    for (let i = 1; i < path.length; i++) {  
        const index = path[i];  
        const nextElements = element.elements!;  
  
        element = nextElements[index];  
    }  
  
    return element;  
};  
  
const goToParentElementFromPath = (json: Element, path: readonly number[]): Element =>  
    goToElementFromPath(json, path.slice(0, path.length - 1));  
  
const getLastElementIndexFromPath = (path: readonly number[]): number => path[path.length - 1];