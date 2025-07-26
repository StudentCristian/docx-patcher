import { describe, expect, it } from "vitest";  
import { patchDocument, PatchType } from "./from-docx";  
import { Paragraph, TextRun } from "@file/paragraph";  
import JSZip from "jszip";  
  
describe("Numbering Serialization", () => {  
    it("should create numbering.xml when list patches are present", async () => {  
        const mockZip = new JSZip();  
        mockZip.file("word/document.xml", `  
            <?xml version="1.0" encoding="UTF-8"?>  
            <w:document>  
                <w:body>  
                    <w:p>  
                        <w:r>  
                            <w:t>{{numbered_list}}</w:t>  
                        </w:r>  
                    </w:p>  
                </w:body>  
            </w:document>  
        `);  
        mockZip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>`);  
  
        const result = await patchDocument({  
            outputType: "uint8array",  
            data: mockZip,  
            patches: {  
                numbered_list: {  
                    type: PatchType.LIST,  
                    listType: "numbered",  
                    children: [  
                        new Paragraph({ children: [new TextRun("Item 1")] }),  
                        new Paragraph({ children: [new TextRun("Item 2")] })  
                    ]  
                }  
            }  
        });  
  
        // Verificar que se creó el archivo numbering.xml  
        const resultZip = await JSZip.loadAsync(result);  
        expect(resultZip.files["word/numbering.xml"]).toBeDefined();  
          
        const numberingXml = await resultZip.files["word/numbering.xml"].async("text");  
        expect(numberingXml).toContain("w:numbering");  
        expect(numberingXml).toContain("w:abstractNum");  
        expect(numberingXml).toContain("w:num");  
    });  
});