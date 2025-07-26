import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { patchDocument, PatchType } from "./from-docx";
import { TextRun } from "@file/paragraph";
import { IListPatch } from "./list-patch-types";

// Utilidad para crear un mock de zip con el marcador adecuado
const createMockZip = (documentContent: string = `
    <?xml version="1.0" encoding="UTF-8"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
            <w:p>
                <w:r>
                    <w:t>{{nested_numbered_list}}</w:t>
                </w:r>
            </w:p>
        </w:body>
    </w:document>
`) => {
    const mockZip = new JSZip();
    mockZip.file("word/document.xml", documentContent);
    mockZip.file("[Content_Types].xml", `
        <?xml version="1.0" encoding="UTF-8"?>
        <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
            <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
            <Default Extension="xml" ContentType="application/xml"/>
            <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
        </Types>
    `);
    return mockZip;
};

describe("Nested Lists", () => {
    it("should handle simple nested structure", async () => {
        const mockZip = createMockZip();

        // Usar estructura más simple para debugging
        const simplePatch: IListPatch = {
            type: PatchType.LIST,
            listType: "numbered",
            nested: false, // Cambiar a false temporalmente
            children: [
                new TextRun("Simple item 1"),
                new TextRun("Simple item 2")
            ]
        };

        const result = await patchDocument({
            outputType: "uint8array",
            data: mockZip,
            patches: {
                nested_numbered_list: simplePatch
            }
        });

        expect(result).toBeDefined();
    });
});
