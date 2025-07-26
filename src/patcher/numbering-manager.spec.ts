import { describe, expect, it } from "vitest";  
import { NumberingManager } from "./numbering-manager";  
import { Paragraph, TextRun } from "@file/paragraph";  
import { PatchType } from "./from-docx";  
  
describe("NumberingManager", () => {  
    it("should generate numbering configuration for numbered lists", () => {  
        const manager = new NumberingManager();  
        const listPatches = {  
            numbered_list: {  
                type: PatchType.LIST,  
                listType: "numbered" as const,  
                children: [  
                    new Paragraph({ children: [new TextRun("Item 1")] }),  
                    new Paragraph({ children: [new TextRun("Item 2")] })  
                ]  
            }  
        };  
  
        manager.generateNumberingFromPatches(listPatches);  
        const config = manager.getNumberingConfig();  
  
        expect(config.config).toHaveLength(1);  
        expect(config.config[0].reference).toContain("numbered-ref");  
        expect(config.config[0].levels).toHaveLength(9); // 0-8 levels  
    });  
  
    it("should generate numbering configuration for bullet lists", () => {  
        const manager = new NumberingManager();  
        const listPatches = {  
            bullet_list: {  
                type: PatchType.LIST,  
                listType: "bullet" as const,  
                children: [  
                    new Paragraph({ children: [new TextRun("Bullet 1")] })  
                ]  
            }  
        };  
  
        manager.generateNumberingFromPatches(listPatches);  
        const config = manager.getNumberingConfig();  
  
        expect(config.config).toHaveLength(1);  
        expect(config.config[0].reference).toContain("bullet-ref");  
        expect(config.config[0].levels[0].format).toBe("bullet");  
    });  
  
    it("should create concrete instances for each patch", () => {  
        const manager = new NumberingManager();  
        const listPatches = {  
            list1: {  
                type: PatchType.LIST,  
                listType: "numbered" as const,  
                children: [new Paragraph({ children: [new TextRun("Item")] })]  
            },  
            list2: {  
                type: PatchType.LIST,  
                listType: "bullet" as const,  
                children: [new Paragraph({ children: [new TextRun("Bullet")] })]  
            }  
        };  
  
        const numbering = manager.generateNumberingFromPatches(listPatches);  
        manager.createConcreteInstances(listPatches);  
  
        expect(numbering.ConcreteNumbering).toHaveLength(3); // 2 + default bullet  
    });  
});