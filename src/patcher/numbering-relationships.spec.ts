import { describe, expect, it } from "vitest";  
import { patchDocument, PatchType } from "./from-docx";  
import { Paragraph, TextRun } from "@file/paragraph";  
import JSZip from "jszip";  
  
describe("Numbering Relationships", () => {  
    it("should create numbering relationship in document.xml.rels", async () => {  
        const mockZip = new JSZip();  
        mockZip.file("word/document.xml", `  
            <?xml version="1.0" encoding="UTF-8"?>  
            <w:document>  
                <w:body>  
                    <w:p>  
                        <w:r>  
                            <w:t>{{test_list}}</w:t>  
                        </w:r>  
                    </w:p>  
                </w:body>  
            </w:document>  
        `);  
        mockZip.file("[Content_Types].xml", `  
            <?xml version="1.0" encoding="UTF-8"?>  
            <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">  
            </Types>  
        `);  
  
        const result = await patchDocument({  
            outputType: "uint8array",  
            data: mockZip,  
            patches: {  
                test_list: {  
                    type: PatchType.LIST,  
                    listType: "numbered",  
                    children: [  
                        new Paragraph({ children: [new TextRun("Item 1")] })  
                    ]  
                }  
            }  
        });  
  
        const resultZip = await JSZip.loadAsync(result);  
          
        // Verificar que existe el archivo de relaciones  
        expect(resultZip.files["word/_rels/document.xml.rels"]).toBeDefined();  
          
        const relsXml = await resultZip.files["word/_rels/document.xml.rels"].async("text");  
        expect(relsXml).toContain("numbering.xml");  
        expect(relsXml).toContain("http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering");  
          
        // Verificar content types  
        const contentTypesXml = await resultZip.files["[Content_Types].xml"].async("text");  
        expect(contentTypesXml).toContain("numbering.xml");  
        expect(contentTypesXml).toContain("wordprocessingml.numbering");  
    });  
});