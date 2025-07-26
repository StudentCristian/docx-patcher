import JSZip from "jszip";
import { Element, js2xml } from "xml-js";

import { ImageReplacer } from "@export/packer/image-replacer";
import { DocumentAttributeNamespaces } from "@file/document";
import { IViewWrapper } from "@file/document-wrapper";
import { File } from "@file/file";
import { FileChild } from "@file/file-child";
import { IMediaData, Media } from "@file/media";
import { ConcreteHyperlink, ExternalHyperlink, ParagraphChild } from "@file/paragraph";
import { TargetModeType } from "@file/relationships/relationship/relationship";
import { IContext } from "@file/xml-components";
import { uniqueId } from "@util/convenience-functions";
import { OutputByType, OutputType } from "@util/output-type";

import { appendContentType } from "./content-types-manager";
import { appendRelationship, getNextRelationshipIndex, checkIfNumberingRelationExists } from "./relationship-manager";
import { replacer } from "./replacer";
import { NumberingManager } from "./numbering-manager";  
import { toJson, isListPatch  } from "./util";
import { IListPatch } from "./list-patch-types";

import xml from "xml";  
import { Formatter } from "@export/formatter";  
import { NumberingReplacer } from "@export/packer/numbering-replacer";

// eslint-disable-next-line functional/prefer-readonly-type
export type InputDataType = Buffer | string | number[] | Uint8Array | ArrayBuffer | Blob | NodeJS.ReadableStream | JSZip;

export const PatchType = {
    DOCUMENT: "file",
    PARAGRAPH: "paragraph",
    LIST: "list", // Nuevo tipo para listas
} as const;


type ParagraphPatch = {
    readonly type: typeof PatchType.PARAGRAPH;
    readonly children: readonly ParagraphChild[];
};

type FilePatch = {
    readonly type: typeof PatchType.DOCUMENT;
    readonly children: readonly FileChild[];
};

// type ListPatch = {
//     readonly type: typeof PatchType.LIST;
//     readonly listType: "numbered" | "bullet";
//     readonly children: readonly ParagraphChild[];
//     readonly reference?: string;
//     readonly startNumber?: number;
//     readonly level?: number;
// };

type IImageRelationshipAddition = {
    readonly key: string;
    readonly mediaDatas: readonly IMediaData[];
};

type IHyperlinkRelationshipAddition = {
    readonly key: string;
    readonly hyperlink: { readonly id: string; readonly link: string };
};

export type IPatch = ParagraphPatch | FilePatch | IListPatch;

export type PatchDocumentOutputType = OutputType;

export type PatchDocumentOptions<T extends PatchDocumentOutputType = PatchDocumentOutputType> = {
    readonly outputType: T;
    readonly data: InputDataType;
    readonly patches: Readonly<Record<string, IPatch>>;
    readonly keepOriginalStyles?: boolean;
    readonly placeholderDelimiters?: Readonly<{
        readonly start: string;
        readonly end: string;
    }>;
    readonly recursive?: boolean;
};

const imageReplacer = new ImageReplacer();
const formatter = new Formatter();
const numberingReplacer = new NumberingReplacer();
const UTF16LE = new Uint8Array([0xff, 0xfe]);
const UTF16BE = new Uint8Array([0xfe, 0xff]);

const compareByteArrays = (a: Uint8Array, b: Uint8Array): boolean => {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
};

export const patchDocument = async <T extends PatchDocumentOutputType = PatchDocumentOutputType>({  
    outputType,  
    data,  
    patches,  
    keepOriginalStyles,  
    placeholderDelimiters = { start: "{{", end: "}}" } as const,  
    recursive = true,  
}: PatchDocumentOptions<T>): Promise<OutputByType[T]> => {  
    const zipContent = data instanceof JSZip ? data : await JSZip.loadAsync(data);  
    const listPatches: Record<string, IListPatch> = {};  
      
    for (const [key, patch] of Object.entries(patches)) {  
        if (isListPatch(patch)) {  
            listPatches[key] = patch;  
        }  
    }  
  
    let numberingManager: NumberingManager | null = null;  
    const numberingReferenceMap = new Map<string, string>();  
      
    if (Object.keys(listPatches).length > 0) {    
        numberingManager = new NumberingManager();    
        numberingManager.generateNumberingFromPatches(listPatches);    
        numberingManager.createConcreteInstances(listPatches);  
          
        // Procesamiento especial para listas anidadas  
        const concreteNumbering = numberingManager.getNumbering().ConcreteNumbering;  
        for (const [patchKey, patch] of Object.entries(listPatches)) {    
            if (patch.nested) {    
                const sharedReference = patch.reference || `${patch.listType}-nested-${patchKey}`;    
                const matchingConcrete = concreteNumbering.find(concrete =>     
                    concrete.reference === sharedReference ||     
                    concrete.reference.includes(sharedReference)    
                );    
                  
                if (matchingConcrete) {    
                    numberingReferenceMap.set(patchKey, matchingConcrete.reference);    
                } else {    
                    numberingReferenceMap.set(patchKey, sharedReference);    
                }    
            } else {    
                const matchingConcrete = concreteNumbering.find(concrete => {    
                    return concrete.reference.includes(patch.listType);    
                });    
                if (matchingConcrete) {    
                    numberingReferenceMap.set(patchKey, matchingConcrete.reference);    
                }    
            }    
        }  
    } // CORRECCIÓN: Cerrar la llave del if  
  
    const contexts = new Map<string, IContext>();  
    const file = {  
        Media: new Media(),  
    } as unknown as File;  
  
    const map = new Map<string, Element>();  
    const imageRelationshipAdditions: IImageRelationshipAddition[] = [];  
    const hyperlinkRelationshipAdditions: IHyperlinkRelationshipAddition[] = [];  
    let hasMedia = false;  
    const binaryContentMap = new Map<string, Uint8Array>();  
  
    // Mover las funciones helper al inicio para evitar hoisting issues  
    const toXml = (jsonObj: Element): string => {  
        const output = js2xml(jsonObj, {  
            attributeValueFn: (str) =>  
                String(str)  
                    .replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, "&amp;")  
                    .replace(/</g, "&lt;")  
                    .replace(/>/g, "&gt;")  
                    .replace(/"/g, "&quot;")  
                    .replace(/'/g, "&apos;"),  
        });  
        return output;  
    };  
  
    const createRelationshipFile = (): Element => ({  
        declaration: {  
            attributes: {  
                version: "1.0",  
                encoding: "UTF-8",  
                standalone: "yes",  
            },  
        },  
        elements: [  
            {  
                type: "element",  
                name: "Relationships",  
                attributes: {  
                    xmlns: "http://schemas.openxmlformats.org/package/2006/relationships",  
                },  
                elements: [],  
            },  
        ],  
    });  
  
    // Resto del procesamiento del archivo...  
    for (const [key, value] of Object.entries(zipContent.files)) {  
        const binaryValue = await value.async("uint8array");  
        const startBytes = binaryValue.slice(0, 2);  
        if (compareByteArrays(startBytes, UTF16LE) || compareByteArrays(startBytes, UTF16BE)) {  
            binaryContentMap.set(key, binaryValue);  
            continue;  
        }  
  
        if (!key.endsWith(".xml") && !key.endsWith(".rels")) {  
            binaryContentMap.set(key, binaryValue);  
            continue;  
        }  
  
        const json = toJson(await value.async("text"));  
  
        if (key === "word/document.xml") {  
            const document = json.elements?.find((i) => i.name === "w:document");  
            if (document && document.attributes) {  
                for (const ns of ["mc", "wp", "r", "w15", "m"] as const) {  
                    document.attributes[`xmlns:${ns}`] = DocumentAttributeNamespaces[ns];  
                }  
                document.attributes["mc:Ignorable"] = `${document.attributes["mc:Ignorable"] || ""} w15`.trim();  
            }  
        }  
  
        if (key.startsWith("word/") && !key.endsWith(".xml.rels")) {  
            const context: IContext = {  
                file,  
                viewWrapper: {  
                    Relationships: {  
                        createRelationship: (  
                            linkId: string,  
                            _: string,  
                            target: string,  
                            __: (typeof TargetModeType)[keyof typeof TargetModeType],  
                        ) => {  
                            hyperlinkRelationshipAdditions.push({  
                                key,  
                                hyperlink: {  
                                    id: linkId,  
                                    link: target,  
                                },  
                            });  
                        },  
                    },  
                } as unknown as IViewWrapper,  
                stack: [],  
            };  
            contexts.set(key, context);  
  
            if (!placeholderDelimiters?.start.trim() || !placeholderDelimiters?.end.trim()) {  
                throw new Error("Both start and end delimiters must be non-empty strings.");  
            }  
  
            const { start, end } = placeholderDelimiters;  
  
            for (const [patchKey, patchValue] of Object.entries(patches)) {  
                const patchText = `${start}${patchKey}${end}`;  
                  
                while (true) {  
                    const { didFindOccurrence } = replacer({  
                        json,  
                        patch: {  
                            ...patchValue,  
                            children: patchValue.children.map((element) => {  
                                if (element instanceof ExternalHyperlink) {  
                                    const concreteHyperlink = new ConcreteHyperlink(element.options.children, uniqueId());  
                                    hyperlinkRelationshipAdditions.push({  
                                        key,  
                                        hyperlink: {  
                                            id: concreteHyperlink.linkId,  
                                            link: element.options.link,  
                                        },  
                                    });  
                                    return concreteHyperlink;  
                                } else {  
                                    return element;  
                                }  
                            }),  
                        } as any,  
                        patchText,  
                        context,  
                        keepOriginalStyles,  
                        numberingReferenceMap,  
                    });  
                    if (!recursive || !didFindOccurrence) {  
                        break;  
                    }  
                }  
            }  
  
            const mediaDatas = imageReplacer.getMediaData(JSON.stringify(json), context.file.Media);  
            if (mediaDatas.length > 0) {  
                hasMedia = true;  
                imageRelationshipAdditions.push({  
                    key,  
                    mediaDatas,  
                });  
            }  
        }  
  
        map.set(key, json);  
    }  
  
    // Procesamiento de relaciones e imágenes...  
    for (const { key, mediaDatas } of imageRelationshipAdditions) {  
        const relationshipKey = `word/_rels/${key.split("/").pop()}.rels`;  
        const relationshipsJson = map.get(relationshipKey) ?? createRelationshipFile();  
        map.set(relationshipKey, relationshipsJson);  
  
        const index = getNextRelationshipIndex(relationshipsJson);  
        const newJson = imageReplacer.replace(JSON.stringify(map.get(key)), mediaDatas, index);  
        map.set(key, JSON.parse(newJson) as Element);  
  
        for (let i = 0; i < mediaDatas.length; i++) {  
            const { fileName } = mediaDatas[i];  
            appendRelationship(  
                relationshipsJson,  
                index + i,  
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",  
                `media/${fileName}`,  
            );  
        }  
    }  
  
    for (const { key, hyperlink } of hyperlinkRelationshipAdditions) {  
        const relationshipKey = `word/_rels/${key.split("/").pop()}.rels`;  
        const relationshipsJson = map.get(relationshipKey) ?? createRelationshipFile();  
        map.set(relationshipKey, relationshipsJson);  
  
        appendRelationship(  
            relationshipsJson,  
            hyperlink.id,  
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",  
            hyperlink.link,  
            TargetModeType.EXTERNAL,  
        );  
    }  
  
    if (hasMedia) {  
        const contentTypesJson = map.get("[Content_Types].xml");  
        if (!contentTypesJson) {  
            throw new Error("Could not find content types file");  
        }  
  
        appendContentType(contentTypesJson, "image/png", "png");  
        appendContentType(contentTypesJson, "image/jpeg", "jpeg");  
        appendContentType(contentTypesJson, "image/jpeg", "jpg");  
        appendContentType(contentTypesJson, "image/bmp", "bmp");  
        appendContentType(contentTypesJson, "image/gif", "gif");  
        appendContentType(contentTypesJson, "image/svg+xml", "svg");  
    }  
  
    // Procesamiento de numbering...  
    if (numberingManager) {    
        const contentTypesJson = map.get("[Content_Types].xml");    
        if (!contentTypesJson) {    
            throw new Error("Could not find content types file");    
        }    
          
        appendContentType(    
            contentTypesJson,     
            "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml",     
            "numbering"    
        );    
  
        const numbering = numberingManager.getNumbering();  
        const mockFile = {  
            Document: {  
                View: null,  
                Relationships: {  
                    RelationshipCount: 0  
                }  
            },  
            Media: new Media(),  
            Numbering: numbering  
        } as unknown as File;  
  
        const context: IContext = {  
            file: mockFile,  
            viewWrapper: mockFile.Document,  
            stack: []  
        };  
  
        const numberingXml = xml(  
            formatter.format(numbering, context),  
            {  
                declaration: {  
                    standalone: "yes",  
                    encoding: "UTF-8",  
                },  
            }  
        );  
  
        map.set("word/numbering.xml", toJson(numberingXml));  
  
        const documentXml = map.get("word/document.xml");  
        if (documentXml) {  
            const xmlString = toXml(documentXml);  
            const replacedXml = numberingReplacer.replace(xmlString, numbering.ConcreteNumbering);  
            map.set("word/document.xml", toJson(replacedXml));  
        }  
  
        for (const [key, value] of map.entries()) {  
            if (key.startsWith("word/header") || key.startsWith("word/footer")) {  
                const xmlString = toXml(value);  
                const replacedXml = numberingReplacer.replace(xmlString, numbering.ConcreteNumbering);  
                map.set(key, toJson(replacedXml));  
            }  
        }  
  
        const documentRelsKey = "word/_rels/document.xml.rels";    
        const documentRels = map.get(documentRelsKey) ?? createRelationshipFile();    
        map.set(documentRelsKey, documentRels);    
          
        const hasNumberingRelation = checkIfNumberingRelationExists(documentRels);    
        if (!hasNumberingRelation) {    
            const nextId = getNextRelationshipIndex(documentRels);    
            appendRelationship(    
                documentRels,    
                nextId,    
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering",    
                "numbering.xml"    
            );    
        }    
    }  
  
    const zip = new JSZip();  
  
    for (const [key, value] of map) {  
        const output = toXml(value);  
        zip.file(key, output);  
    }  
  
    for (const [key, value] of binaryContentMap) {  
        zip.file(key, value);  
    }  
  
    for (const { data: stream, fileName } of file.Media.Array) {  
        zip.file(`word/media/${fileName}`, stream);  
    }  
  
    return zip.generateAsync({  
        type: outputType,  
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  
        compression: "DEFLATE",  
    });  
};

// const toXml = (jsonObj: Element): string => {
//     const output = js2xml(jsonObj, {
//         attributeValueFn: (str) =>
//             String(str)
//                 .replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, "&amp;")
//                 .replace(/</g, "&lt;")
//                 .replace(/>/g, "&gt;")
//                 .replace(/"/g, "&quot;")
//                 .replace(/'/g, "&apos;"), // cspell:words apos
//     });
//     return output;
// };

// const createRelationshipFile = (): Element => ({
//     declaration: {
//         attributes: {
//             version: "1.0",
//             encoding: "UTF-8",
//             standalone: "yes",
//         },
//     },
//     elements: [
//         {
//             type: "element",
//             name: "Relationships",
//             attributes: {
//                 xmlns: "http://schemas.openxmlformats.org/package/2006/relationships",
//             },
//             elements: [],
//         },
//     ],
// });