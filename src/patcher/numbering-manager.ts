import { Numbering, INumberingOptions } from "@file/numbering";
import { ILevelsOptions, LevelFormat } from "@file/numbering/level";
import { AlignmentType } from "@file/paragraph";
import { convertInchesToTwip } from "@util/convenience-functions";
import { IListPatch, INestedListItem } from "./list-patch-types";

export class NumberingManager {
    private numberingConfig: INumberingOptions = { config: [] };
    private numbering: Numbering | null = null;
    private patchReferences = new Map<string, string>(); // Almacenar referencias por patch

    public generateNumberingFromPatches(listPatches: Record<string, IListPatch>): Numbering {
        const configs: Array<{ levels: ILevelsOptions[]; reference: string }> = [];

        for (const [patchKey, patch] of Object.entries(listPatches)) {
            if (patch.nested && this.isNestedStructure(patch.children)) {
                this.generateNestedNumberingFromPatch(patch, patchKey, configs);
                continue; // Ya procesado como anidado
            }
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

    // Soporte para listas anidadas
    public generateNestedNumberingFromPatch(
        patch: IListPatch,
        patchKey: string,
        configs: Array<{ levels: ILevelsOptions[]; reference: string }>
    ): void {
        if (patch.nested && this.isNestedStructure(patch.children)) {
            const maxLevel = this.detectMaxLevel(patch.children as INestedListItem[]);
            const sharedReference = patch.reference || `${patch.listType}-nested-${patchKey}-${Date.now()}`;
            this.patchReferences.set(patchKey, sharedReference);

            // Crear configuración abstracta que soporte todos los niveles detectados
            const levels = this.createLevelsForListType(patch.listType, 0, patch.startNumber || 1).slice(0, maxLevel + 1);
            configs.push({ levels, reference: sharedReference });
        }
    }

    private detectMaxLevel(items: readonly INestedListItem[], currentLevel = 0): number {
        let maxLevel = currentLevel;
        for (const item of items) {
            if (item.children && item.children.length > 0) {
                const childMaxLevel = this.detectMaxLevel(item.children, currentLevel + 1);
                maxLevel = Math.max(maxLevel, childMaxLevel);
            }
        }
        return maxLevel;
    }

    private isNestedStructure(children: readonly any[]): children is readonly INestedListItem[] {
        return Array.isArray(children) && children.some(child =>
            typeof child === 'object' &&
            child !== null &&
            'content' in child &&
            'children' in child
        );
    }

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