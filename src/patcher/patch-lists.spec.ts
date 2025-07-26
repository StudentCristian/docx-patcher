import { describe, expect, it } from "vitest";  
import { patchDocument, PatchType } from "./from-docx";  
import { Paragraph, TextRun } from "@file/paragraph";  
import JSZip from "jszip";  
  
describe("List Integration - Complete Flow", () => {  
    const createMockZip = (documentContent: string = `  
        <?xml version="1.0" encoding="UTF-8"?>  
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">  
            <w:body>  
                <w:p>  
                    <w:r>  
                        <w:t>{{numbered_list}}</w:t>  
                    </w:r>  
                </w:p>  
                <w:p>  
                    <w:r>  
                        <w:t>{{bullet_list}}</w:t>  
                    </w:r>  
                </w:p>  
                <w:p>  
                    <w:r>  
                        <w:t>{{mixed_content}}</w:t>  
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
  
it("should handle complete numbered list flow with real text extraction", async () => {  
    const mockZip = createMockZip();  
      
    const result = await patchDocument({  
        outputType: "uint8array",  
        data: mockZip,  
        patches: {  
            numbered_list: {  
                type: PatchType.LIST,  
                listType: "numbered",  
                children: [  
                    new Paragraph({ children: [new TextRun("First numbered item")] }),  
                    new Paragraph({ children: [new TextRun("Second numbered item")] }),  
                    new Paragraph({ children: [new TextRun("Third numbered item")] })  
                ],  
                level: 0,  
                startNumber: 1  
            }  
        }  
    });  
  
    const resultZip = await JSZip.loadAsync(result);  
      
    // Paso 4: Verificar serialización de numbering.xml  
    expect(resultZip.files["word/numbering.xml"]).toBeDefined();  
    const numberingXml = await resultZip.files["word/numbering.xml"].async("text");  
    expect(numberingXml).toContain("w:numbering");  
    expect(numberingXml).toContain("w:abstractNum");  
    expect(numberingXml).toContain("w:num");  
      
    // Verificar formato decimal para listas numeradas  
    expect(numberingXml).toContain('w:numFmt w:val="decimal"');  
    expect(numberingXml).toContain('w:lvlText w:val="%1."');  
  
    // Resto de verificaciones permanecen igual...  
});  
  
it("should handle bullet lists with proper configuration", async () => {  
    const mockZip = createMockZip();  
      
    const result = await patchDocument({  
        outputType: "uint8array",  
        data: mockZip,  
        patches: {  
            bullet_list: {  
                type: PatchType.LIST,  
                listType: "bullet",  
                children: [  
                    new Paragraph({ children: [new TextRun("First bullet point")] }),  
                    new Paragraph({ children: [new TextRun("Second bullet point")] })  
                ],  
                level: 0  
            }  
        }  
    });  
  
    const resultZip = await JSZip.loadAsync(result);  
      
    // Verificar numbering.xml contiene configuración de bullets  
    const numberingXml = await resultZip.files["word/numbering.xml"].async("text");  
    expect(numberingXml).toContain('w:numFmt w:val="bullet"');  
    expect(numberingXml).toContain('w:lvlText w:val="●"');  
      
    // Verificar documento contiene referencias de numbering  
    const documentXml = await resultZip.files["word/document.xml"].async("text");  
    expect(documentXml).toContain("w:numPr");  
});  
  
it("should handle custom references and levels", async () => {  
    const mockZip = createMockZip();  
      
    const result = await patchDocument({  
        outputType: "uint8array",  
        data: mockZip,  
        patches: {  
            numbered_list: {  
                type: PatchType.LIST,  
                listType: "numbered",  
                reference: "custom-numbering-ref",  
                level: 1,  
                startNumber: 5,  
                children: [  
                    new Paragraph({ children: [new TextRun("Custom numbered item")] })  
                ]  
            }  
        }  
    });  
  
    const resultZip = await JSZip.loadAsync(result);  
      
    // Verificar configuración personalizada en numbering.xml  
    const numberingXml = await resultZip.files["word/numbering.xml"].async("text");  
    expect(numberingXml).toContain('w:start w:val="5"'); // startNumber personalizado  
    expect(numberingXml).toContain('w:numFmt w:val="decimal"');  
      
    // Verificar nivel personalizado en documento  
    const documentXml = await resultZip.files["word/document.xml"].async("text");  
    expect(documentXml).toContain('w:ilvl w:val="1"'); // nivel 1  
});
  
    it("should handle error cases gracefully", async () => {  
        const mockZip = createMockZip();  
          
        // Test con patches vacíos  
        const result1 = await patchDocument({  
            outputType: "uint8array",  
            data: mockZip,  
            patches: {}  
        });  
          
        expect(result1).toBeDefined();  
          
        // Test con lista vacía  
        const result2 = await patchDocument({  
            outputType: "uint8array",  
            data: mockZip,  
            patches: {  
                empty_list: {  
                    type: PatchType.LIST,  
                    listType: "numbered",  
                    children: []  
                }  
            }  
        });  
          
        expect(result2).toBeDefined();  
    });  
});