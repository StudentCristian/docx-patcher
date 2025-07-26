import { Numbering, INumberingOptions } from "@file/numbering";  
import { ILevelsOptions, LevelFormat } from "@file/numbering/level";  
import { AlignmentType } from "@file/paragraph";  
import { convertInchesToTwip } from "@util/convenience-functions";  
import { IListPatch } from "./list-patch-types";  
  
export class NumberingManager {  
    private numberingConfig: INumberingOptions = { config: [] };
    private numbering: Numbering | null = null;
    // private referenceCounter = 0;
    private patchReferences = new Map<string, string>(); // Nuevo: almacenar referencias por patch

    public generateNumberingFromPatches(listPatches: Record<string, IListPatch>): Numbering {
        const configs: Array<{ levels: ILevelsOptions[]; reference: string }> = [];

        for (const [patchKey, patch] of Object.entries(listPatches)) {
            // Generar referencia específica que incluya el tipo de lista y el nombre del patch
            const specificReference = `${patch.listType}-${patchKey}-ref`;
            this.patchReferences.set(patchKey, specificReference); // Almacenar la referencia
            const levels = this.createLevelsForListType(patch.listType, patch.level || 0, patch.startNumber || 1);
            configs.push({ levels, reference: specificReference });
        }

        this.numberingConfig = { config: configs };
        this.numbering = new Numbering(this.numberingConfig);
        return this.numbering;
    }
  
    // private generateUniqueReference(listType: string): string {  
    //     return `${listType}-ref-${++this.referenceCounter}`;  
    // }  
  
    private createLevelsForListType(  
        listType: "numbered" | "bullet",   
        startLevel: number = 0,  
        startNumber: number = 1  
    ): ILevelsOptions[] {  
        if (listType === "numbered") {  
            return this.createNumberedLevels(startLevel, startNumber);  
        } else {  
            return this.createBulletLevels(startLevel);  
        }  
    }  
  
    private createNumberedLevels(startLevel: number, startNumber: number): ILevelsOptions[] {  
        const levels: ILevelsOptions[] = [];  
          
        for (let i = startLevel; i <= 8; i++) {  
            levels.push({  
                level: i,  
                format: LevelFormat.DECIMAL,  
                text: `%${i + 1}.`,  
                alignment: AlignmentType.START,  
                start: i === startLevel ? startNumber : 1,  
                style: {  
                    paragraph: {  
                        indent: {   
                            left: convertInchesToTwip(0.5 * (i + 1)),   
                            hanging: convertInchesToTwip(0.25)   
                        },  
                    },  
                },  
            });  
        }  
          
        return levels;  
    }  
  
    private createBulletLevels(startLevel: number): ILevelsOptions[] {  
        const bulletSymbols = ["\u25CF", "\u25CB", "\u25A0"]; // •, ○, ■  
        const levels: ILevelsOptions[] = [];  
          
        for (let i = startLevel; i <= 8; i++) {  
            levels.push({  
                level: i,  
                format: LevelFormat.BULLET,  
                text: bulletSymbols[i % bulletSymbols.length],  
                alignment: AlignmentType.LEFT,  
                start: 1,  
                style: {  
                    paragraph: {  
                        indent: {   
                            left: convertInchesToTwip(0.5 * (i + 1)),   
                            hanging: convertInchesToTwip(0.25)   
                        },  
                    },  
                },  
            });  
        }  
          
        return levels;  
    }  
  
    public createConcreteInstances(patches: Record<string, IListPatch>): void {  
        if (!this.numbering) {
            throw new Error("Numbering must be generated before creating concrete instances");
        }

        for (const [patchKey, _patch] of Object.entries(patches)) {
            const reference = this.patchReferences.get(patchKey); // Usar referencia almacenada
            if (reference) {
                const instance = 0; // Por defecto, cada patch usa instancia 0
                this.numbering.createConcreteNumberingInstance(reference, instance);
            }
        }
    }  
  
    public getNumbering(): Numbering {  
        if (!this.numbering) {  
            throw new Error("Numbering has not been generated yet");  
        }  
        return this.numbering;  
    }  
  
    public getNumberingConfig(): INumberingOptions {  
        return this.numberingConfig;  
    }  
}