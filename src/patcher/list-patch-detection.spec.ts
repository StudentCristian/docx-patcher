import { describe, expect, it } from "vitest";
import { PatchType } from "./from-docx";
import { detectListPatches, validateListPatch } from "./patch-detector";
// import { Paragraph } from "@file/paragraph";

// Mock Paragraph for testing
class MockParagraph {
    constructor(public text: string) {}
}

describe("List Patch Detection", () => {
    it("should detect list patches correctly", () => {
        const patches = {
            regular_patch: {
                type: PatchType.PARAGRAPH,
                children: [new MockParagraph("text")]
            },
            numbered_list: {
                type: PatchType.LIST,
                listType: "numbered",
                children: [
                    new MockParagraph("Item 1"),
                    new MockParagraph("Item 2")
                ]
            },
            bullet_list: {
                type: PatchType.LIST,
                listType: "bullet",
                children: [
                    new MockParagraph("Bullet 1")
                ]
            }
        };

        const listPatches = detectListPatches(patches);
        expect(listPatches).toEqual(["numbered_list", "bullet_list"]);
    });

    it("should validate list patches correctly", () => {
        const validPatch = {
            type: PatchType.LIST,
            listType: "numbered",
            children: [new MockParagraph("Item")] 
        };

        const invalidPatch = {
            type: PatchType.LIST,
            listType: "invalid",
            children: []
        };

        expect(validateListPatch(validPatch)).toBe(true);
        expect(validateListPatch(invalidPatch)).toBe(false);
    });
});
