// Patch a document with nested list patches - demonstrates numbered and bullet lists  
  
import * as fs from "fs";  
import { patchDocument, PatchType, Paragraph, TextRun } from "docx";  
  
patchDocument({  
    outputType: "nodebuffer",  
    data: fs.readFileSync("demo/assets/template-lists.docx"),  
    patches: {  
        simple_numbered_list: {  
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
        custom_numbered_list: {  
            type: PatchType.LIST,  
            listType: "numbered",  
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
            startNumber: 10, // Start from number 10  
            reference: "custom-numbering-ref"  
        },  
        multilevel_list: {  
            type: PatchType.LIST,  
            listType: "numbered",  
            children: [  
                new Paragraph({ children: [new TextRun("Level 0 item")] }),  
            ],  
            level: 1, // Indented level  
            startNumber: 1  
        }  
    },  
}).then((doc) => {  
    fs.writeFileSync("Document with Lists.docx", doc);  
    console.log("Document with lists created successfully!");  
    console.log("Features demonstrated:");  
    console.log("- Numbered lists with custom start numbers");  
    console.log("- Bullet lists");  
    console.log("- Mixed content with formatting");  
    console.log("- Different indentation levels");  
    console.log("- Custom references");  
});