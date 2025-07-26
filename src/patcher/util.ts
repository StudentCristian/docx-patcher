import { PatchType } from "./from-docx";
import { IListPatch } from "./list-patch-types";

import xml from "xml";
import { Element, xml2js } from "xml-js";

import { Formatter } from "@export/formatter";
import { Text } from "@file/paragraph/run/run-components/text";
import { LevelFormat, AlignmentType, convertInchesToTwip, ILevelsOptions, INumberingOptions } from "index";


const formatter = new Formatter();

export const toJson = (xmlData: string): Element => {
    const xmlObj = xml2js(xmlData, { compact: false, captureSpacesBetweenElements: true }) as Element;
    return xmlObj;
};

// eslint-disable-next-line functional/prefer-readonly-type
export const createTextElementContents = (text: string): Element[] => {
    const textJson = toJson(xml(formatter.format(new Text({ text }))));

    return textJson.elements![0].elements ?? [];
};

export const patchSpaceAttribute = (element: Element): Element => ({
    ...element,
    attributes: {
        "xml:space": "preserve",
    },
});

// eslint-disable-next-line functional/prefer-readonly-type
export const getFirstLevelElements = (relationships: Element, id: string): Element[] =>
    relationships.elements?.filter((e) => e.name === id)[0].elements ?? [];

export const isListPatch = (patch: any): patch is IListPatch => {
    return patch?.type === PatchType.LIST;
};

export const generateListReference = (listType: string, index: number): string => {
    return `${listType}_ref_${index}`;
};

export const getDefaultListConfiguration = (listType: "numbered" | "bullet") => {
    if (listType === "numbered") {
        return {
            format: "decimal" as const,
            text: "%1.",
            startNumber: 1
        };
    } else {
        return {
            format: "bullet" as const,
            text: "•",
            startNumber: 1
        };
    }
};

// Listas por defecto para la configuración de numeración
export const getDefaultNumberingConfiguration = (listType: "numbered" | "bullet"): ILevelsOptions[] => {  
    if (listType === "numbered") {  
        return [{  
            level: 0,  
            format: LevelFormat.DECIMAL,  
            text: "%1.",  
            alignment: AlignmentType.START,  
            start: 1,  
            style: {  
                paragraph: {  
                    indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) },  
                },  
            },  
        }];  
    } else {  
        return [{  
            level: 0,  
            format: LevelFormat.BULLET,  
            text: "\u25CF",  
            alignment: AlignmentType.LEFT,  
            start: 1,  
            style: {  
                paragraph: {  
                    indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) },  
                },  
            },  
        }];  
    }  
};  
  
export const validateNumberingConfiguration = (config: INumberingOptions): boolean => {  
    return config.config.every(item =>   
        item.reference &&   
        Array.isArray(item.levels) &&   
        item.levels.length > 0  
    );  
};
