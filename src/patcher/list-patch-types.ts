import { Paragraph } from "@file/paragraph";

export interface IListPatch {
    readonly type: "list";
    readonly listType: "numbered" | "bullet";
    readonly children: readonly Paragraph[];
    readonly reference?: string;
    readonly startNumber?: number;
    readonly level?: number;
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
