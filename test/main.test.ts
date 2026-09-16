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

describe("getActiveCanvas", () => {
    function makeLeaf(file: unknown, canvas: unknown) {
        return { view: { file, canvas } };
    }

    function makePlugin(app: unknown): any {
        return new CanvasParentNodesPlugin(app as any, {} as any);
    }

    it("returns the canvas belonging to the active file when multiple canvases are open", () => {
        const activeFile = { path: "b.canvas" };
        const canvasA = { name: "A" };
        const canvasB = { name: "B" };
        const app = {
            workspace: {
                getActiveFile: () => activeFile,
                getLeavesOfType: () => [
                    makeLeaf({ path: "a.canvas" }, canvasA),
                    makeLeaf(activeFile, canvasB),
                ],
            },
        };

        expect(makePlugin(app).getActiveCanvas()).toBe(canvasB);
    });

    it("falls back to the first canvas leaf when no leaf matches the active file", () => {
        const canvasA = { name: "A" };
        const canvasB = { name: "B" };
        const app = {
            workspace: {
                getActiveFile: () => ({ path: "not-open.canvas" }),
                getLeavesOfType: () => [
                    makeLeaf({ path: "a.canvas" }, canvasA),
                    makeLeaf({ path: "b.canvas" }, canvasB),
                ],
            },
        };

        expect(makePlugin(app).getActiveCanvas()).toBe(canvasA);
    });

    it("returns null when there are no canvas leaves open", () => {
        const app = {
            workspace: {
                getActiveFile: () => null,
                getLeavesOfType: () => [],
            },
        };

        expect(makePlugin(app).getActiveCanvas()).toBeNull();
    });

    it("stays correct after focus moved through an unrelated panel (regression)", () => {
        // Previously, focusing another plugin's panel overwrote a cached
        // "currentCanvasView" with a non-canvas view. getActiveCanvas() then fell
        // back to the first canvas leaf instead of the one matching the active
        // file, so zoomToNode silently targeted the wrong canvas.
        const activeFile = { path: "b.canvas" };
        const canvasA = { name: "A" };
        const canvasB = { name: "B" };
        const app = {
            workspace: {
                getActiveFile: () => activeFile,
                getLeavesOfType: () => [
                    makeLeaf({ path: "a.canvas" }, canvasA),
                    makeLeaf(activeFile, canvasB),
                ],
            },
        };
        const pluginInstance = makePlugin(app);
        pluginInstance.currentCanvasView = { getViewType: () => "some-other-plugin-view" };

        expect(pluginInstance.getActiveCanvas()).toBe(canvasB);
    });
});
