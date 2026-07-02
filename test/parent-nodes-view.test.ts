/**
 * @jest-environment jsdom
 */

import { ParentNodesView } from "../src/parent-nodes-view";
import { WorkspaceLeaf } from "obsidian";

jest.mock("helper", () => ({ zoomToNode: jest.fn() }));

function addObsidianHelpers(el: Element): Element {
    (el as any).createEl = (tag: string, opts: any = {}): Element => {
        const child = document.createElement(tag);
        if (opts.cls) child.className = opts.cls;
        if (opts.text) child.textContent = opts.text;
        if (opts.attr) {
            for (const [k, v] of Object.entries(opts.attr as Record<string, unknown>)) {
                child.setAttribute(k, String(v));
            }
        }
        addObsidianHelpers(child);
        el.appendChild(child);
        return child;
    };
    (el as any).createSpan = (opts: any = {}): Element => (el as any).createEl("span", opts);
    (el as any).empty = (): void => { while (el.firstChild) el.removeChild(el.firstChild); };
    (el as any).addClass = (cls: string): void => { el.classList.add(cls); };
    return el;
}

const mockPlugin: any = {
    settings: { parentNodeTitleLength: 50 },
    registerParentNodesView: jest.fn(),
    unregisterParentNodesView: jest.fn(),
};

function createView(): ParentNodesView {
    const view = new ParentNodesView(new WorkspaceLeaf(), mockPlugin);
    (view as any).contentEl = addObsidianHelpers(document.createElement("div"));
    return view;
}

const sampleNodes = [
    { id: "1", label: "Alpha node", type: "text" },
    { id: "2", label: "Beta node", type: "file" },
    { id: "3", label: "Gamma node", type: "text" },
];

describe("ParentNodesView search bar", () => {
    it("is not rendered when there are no nodes", () => {
        const view = createView();
        view.setViewData({ nodes: [], message: "No nodes." });
        const input = (view as any).contentEl.querySelector(".canvas-parent-nodes-search");
        expect(input).toBeNull();
    });

    it("is rendered when nodes are present", () => {
        const view = createView();
        view.setViewData({ nodes: sampleNodes, canvasTitle: "My Canvas" });
        const input = (view as any).contentEl.querySelector(".canvas-parent-nodes-search");
        expect(input).not.toBeNull();
        expect(input.getAttribute("placeholder")).toBe("Search parent node title");
    });

    it("shows all items before any input", () => {
        const view = createView();
        view.setViewData({ nodes: sampleNodes, canvasTitle: "My Canvas" });
        const items = Array.from(
            (view as any).contentEl.querySelectorAll<HTMLElement>(".canvas-parent-nodes-item")
        );
        expect(items).toHaveLength(3);
        items.forEach((item) => expect(item.style.display).not.toBe("none"));
    });

    it("filters items by label", () => {
        const view = createView();
        view.setViewData({ nodes: sampleNodes, canvasTitle: "My Canvas" });
        const input: HTMLInputElement = (view as any).contentEl.querySelector(".canvas-parent-nodes-search");

        input.value = "alpha";
        input.dispatchEvent(new Event("input"));

        const items = Array.from(
            (view as any).contentEl.querySelectorAll<HTMLElement>(".canvas-parent-nodes-item")
        );
        expect(items[0].style.display).toBe("");
        expect(items[1].style.display).toBe("none");
        expect(items[2].style.display).toBe("none");
    });

    it("filters case-insensitively", () => {
        const view = createView();
        view.setViewData({ nodes: sampleNodes, canvasTitle: "My Canvas" });
        const input: HTMLInputElement = (view as any).contentEl.querySelector(".canvas-parent-nodes-search");

        input.value = "BETA";
        input.dispatchEvent(new Event("input"));

        const items = Array.from(
            (view as any).contentEl.querySelectorAll<HTMLElement>(".canvas-parent-nodes-item")
        );
        expect(items[0].style.display).toBe("none");
        expect(items[1].style.display).toBe("");
        expect(items[2].style.display).toBe("none");
    });

    it("shows all items when search is cleared", () => {
        const view = createView();
        view.setViewData({ nodes: sampleNodes, canvasTitle: "My Canvas" });
        const input: HTMLInputElement = (view as any).contentEl.querySelector(".canvas-parent-nodes-search");

        input.value = "alpha";
        input.dispatchEvent(new Event("input"));

        input.value = "";
        input.dispatchEvent(new Event("input"));

        const items = Array.from(
            (view as any).contentEl.querySelectorAll<HTMLElement>(".canvas-parent-nodes-item")
        );
        items.forEach((item) => expect(item.style.display).toBe(""));
    });

    it("hides all items when query matches nothing", () => {
        const view = createView();
        view.setViewData({ nodes: sampleNodes, canvasTitle: "My Canvas" });
        const input: HTMLInputElement = (view as any).contentEl.querySelector(".canvas-parent-nodes-search");

        input.value = "zzz";
        input.dispatchEvent(new Event("input"));

        const items = Array.from(
            (view as any).contentEl.querySelectorAll<HTMLElement>(".canvas-parent-nodes-item")
        );
        items.forEach((item) => expect(item.style.display).toBe("none"));
    });
});
