// Patch a document with list patches - demonstrates numbered and bullet lists  
  
import * as fs from "fs";  
import { patchDocument, PatchType, Paragraph, TextRun } from "docx";  
  
patchDocument({  
    outputType: "nodebuffer",  
    data: fs.readFileSync("demo/assets/template.docx"),  
    patches: {  
        my_list: {  
            type: PatchType.LIST,  
            listType: "numbered",  
            children: [  
                new Paragraph({ children: [new TextRun("First numbered item")] }),  
                new Paragraph({ children: [new TextRun("Second numbered item")] }),  
                new Paragraph({ children: [new TextRun("Third numbered item with more content")] }),  
            ],  
            level: 0,  
            startNumber: 1  
        },  
        bullet_example: {  
            type: PatchType.LIST,  
            listType: "bullet",  
            children: [  
                new Paragraph({ children: [new TextRun("First bullet point")] }),  
                new Paragraph({ children: [new TextRun("Second bullet point")] }),  
                new Paragraph({ children: [new TextRun("Third bullet point")] }),  
            ],  
            level: 0  
        },  
        mixed_list: {  
            type: PatchType.LIST,  
            listType: "bullet",  
            children: [  
                new Paragraph({   
                    children: [  
                        new TextRun("Complex item with "),  
                        new TextRun({ text: "bold text", bold: true }),  
                        new TextRun(" and normal text")  
                    ]   
                }),  
                new Paragraph({ children: [new TextRun("Simple numbered item")] }),  
            ],  
            level: 0,  
            startNumber: 10 // Start from number 10  
        }  
    },  
}).then((doc) => {  
    fs.writeFileSync("DocumentLists.docx", doc);  
    console.log("Document with lists created successfully!");  
});