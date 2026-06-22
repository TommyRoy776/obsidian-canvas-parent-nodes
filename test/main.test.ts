import CanvasParentNodesPlugin from "../src/main";
import { TFile } from "obsidian";
import type { TAbstractFile } from "obsidian";
import type { AllCanvasNodeData } from "obsidian/canvas";

const plugin: any = new CanvasParentNodesPlugin({} as any, {} as any);

describe("isCanvasFile", () => {
    it("returns true for a .canvas TFile", () => {
        const file = new TFile();
        file.extension = "canvas";
        expect(plugin.isCanvasFile(file)).toBe(true);
    });

    it("returns false for a non-canvas TFile", () => {
        const file = new TFile();
        file.extension = "md";
        expect(plugin.isCanvasFile(file)).toBe(false);
    });

    it("returns false for a non-TFile or missing file", () => {
        expect(plugin.isCanvasFile({} as TAbstractFile)).toBe(false);
        expect(plugin.isCanvasFile(null)).toBe(false);
        expect(plugin.isCanvasFile(undefined)).toBe(false);
    });
});

describe("getNodeLabel", () => {
    it("uses an explicit label when present", () => {
        const node = { id: "n1", type: "text", text: "hello", label: "Custom Label" } as unknown as AllCanvasNodeData;
        expect(plugin.getNodeLabel(node)).toBe("Custom Label");
    });

    it("falls back to the first line of a text node", () => {
        const node = { id: "n2", type: "text", text: "First line\nSecond line" } as unknown as AllCanvasNodeData;
        expect(plugin.getNodeLabel(node)).toBe("First line");
    });

    it("falls back to the filename for file nodes", () => {
        const node = { id: "n3", type: "file", file: "folder/sub/Note.md" } as unknown as AllCanvasNodeData;
        expect(plugin.getNodeLabel(node)).toBe("Note.md");
    });

    it("falls back to the url for link nodes", () => {
        const node = { id: "n4", type: "link", url: "https://example.com" } as unknown as AllCanvasNodeData;
        expect(plugin.getNodeLabel(node)).toBe("https://example.com");
    });

    it("falls back to type and truncated id when nothing else matches", () => {
        const node = { id: "abcdefgh", type: "group" } as unknown as AllCanvasNodeData;
        expect(plugin.getNodeLabel(node)).toBe("group (abcdef)");
    });
});

describe("toParentNodeInfo", () => {
    it("maps a canvas node to a ParentNodeInfo", () => {
        const node = { id: "n5", type: "text", text: "Hello world" } as unknown as AllCanvasNodeData;
        expect(plugin.toParentNodeInfo(node)).toEqual({
            id: "n5",
            label: "Hello world",
            type: "text",
        });
    });
});
