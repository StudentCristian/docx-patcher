import * as fs from "fs";  
import { patchDocument, PatchType, Paragraph, TextRun } from "docx";  
  
patchDocument({  
    outputType: "nodebuffer",   
    data: fs.readFileSync("demo/assets/template-bullets.docx"),  
    patches: {  
        level_0_bullets: {  
            type: PatchType.LIST,  
            listType: "bullet",  
            level: 0, // Nivel 0 - círculo sólido (●)  
            children: [  
                new Paragraph({ children: [new TextRun("Main point level 0")] }),  
            ]  
        },  
        level_1_bullets: {  
            type: PatchType.LIST,  
            listType: "bullet",   
            level: 1, // Nivel 1 - círculo vacío (○)  
            children: [  
                new Paragraph({ children: [new TextRun("Sub point level 1")] }),  
            ]  
        },  
        level_2_bullets: {  
            type: PatchType.LIST,  
            listType: "bullet",  
            level: 2, // Nivel 2 - cuadrado sólido (■)  
            children: [  
                new Paragraph({ children: [new TextRun("Sub-sub point level 2")] }),  
            ]  
        },  
        back_to_level_0: {  
            type: PatchType.LIST,  
            listType: "bullet",  
            level: 0, // De vuelta al nivel 0  
            children: [  
                new Paragraph({ children: [new TextRun("Back to main level")] }),  
            ]  
        }  
    }  
}).then((doc) => {  
    fs.writeFileSync("Multilevel Bullets.docx", doc);  
    console.log("Document with multilevel bullets created!");  
});