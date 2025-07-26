import * as fs from "fs";  
import { Paragraph, patchDocument, PatchType, TextRun } from "docx";  
  
patchDocument({  
    outputType: "nodebuffer",  
    data: fs.readFileSync("demo/assets/template-nested.docx"),  
    patches: {  
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
        multilevel_nested_bullets: {  
            type: PatchType.LIST,  
            listType: "bullet",  
            nested: true, // CLAVE: Habilitar estructura anidada  
            children: [  
                {  
                    content: [new TextRun("Main point level 0 (●)")],  
                    level: 0,  
                    children: [  
                        {  
                            content: [new TextRun("Sub point level 1 (○)")],  
                            level: 1,  
                            children: [  
                                {  
                                    content: [new TextRun("Sub-sub point level 2 (■)")],  
                                    level: 2  
                                }  
                            ]  
                        },  
                        {  
                            content: [new TextRun("Another sub point level 1 (○)")],  
                            level: 1  
                        }  
                    ]  
                },  
                {  
                    content: [new TextRun("Back to main level 0 (●)")],  
                    level: 0  
                }  
            ]  
        },  
        multilevel_nested_numbered: {  
            type: PatchType.LIST,  
            listType: "numbered",  
            nested: true,  
            children: [  
                {  
                    content: [new TextRun("First numbered item")],  
                    level: 0,  
                    children: [  
                        {  
                            content: [new TextRun("Nested numbered sub-item")],  
                            level: 1,  
                            children: [  
                                {  
                                    content: [new TextRun("Deep nested numbered item")],  
                                    level: 2  
                                }  
                            ]  
                        }  
                    ]  
                },  
                {  
                    content: [new TextRun("Second numbered item")],  
                    level: 0  
                }  
            ]  
        }  
    }  
}).then((doc) => {  
    fs.writeFileSync("True Nested Lists.docx", doc);  
    console.log("Document with true nested structure created successfully!");  
    console.log("Features demonstrated:");  
    console.log("- True nested bullet lists with hierarchy");  
    console.log("- True nested numbered lists with hierarchy");  
    console.log("- Multiple levels (●, ○, ■) for bullets");  
    console.log("- Proper indentation and numbering");  
});