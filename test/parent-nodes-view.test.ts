/**
 * @jest-environment jsdom
 */

import { ParentNodesView } from "../src/parent-nodes-view";
import { WorkspaceLeaf } from "obsidian";

jest.mock("helper", () => ({ zoomToNode: jest.fn() }));

// Must match the PAGE_SIZE constant in src/parent-nodes-view.ts.
const PAGE_SIZE = 15;

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
    (el as any).createDiv = (opts: any = {}): Element => (el as any).createEl("div", opts);
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

function makeNodes(count: number): { id: string; label: string; type: string }[] {
    return Array.from({ length: count }, (_, i) => ({
        id: `id-${i + 1}`,
        label: `Node ${String(i + 1).padStart(2, "0")}`,
        type: "text",
    }));
}

const sampleNodes = [
    { id: "1", label: "Alpha node", type: "text" },
    { id: "2", label: "Beta node", type: "file" },
    { id: "3", label: "Gamma node", type: "text" },
];

function itemLabels(view: ParentNodesView): string[] {
    const nodeList = (view as any).contentEl.querySelectorAll(".canvas-parent-nodes-label") as NodeListOf<HTMLElement>;
    return Array.from(nodeList).map((el) => el.textContent ?? "");
}

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
        expect(itemLabels(view)).toEqual(["Alpha node", "Beta node", "Gamma node"]);
    });

    it("filters items by label", () => {
        const view = createView();
        view.setViewData({ nodes: sampleNodes, canvasTitle: "My Canvas" });
        const input: HTMLInputElement = (view as any).contentEl.querySelector(".canvas-parent-nodes-search");

        input.value = "alpha";
        input.dispatchEvent(new Event("input"));

        expect(itemLabels(view)).toEqual(["Alpha node"]);
    });

    it("filters case-insensitively", () => {
        const view = createView();
        view.setViewData({ nodes: sampleNodes, canvasTitle: "My Canvas" });
        const input: HTMLInputElement = (view as any).contentEl.querySelector(".canvas-parent-nodes-search");

        input.value = "BETA";
        input.dispatchEvent(new Event("input"));

        expect(itemLabels(view)).toEqual(["Beta node"]);
    });

    it("shows all items when search is cleared", () => {
        const view = createView();
        view.setViewData({ nodes: sampleNodes, canvasTitle: "My Canvas" });
        const input: HTMLInputElement = (view as any).contentEl.querySelector(".canvas-parent-nodes-search");

        input.value = "alpha";
        input.dispatchEvent(new Event("input"));
        input.value = "";
        input.dispatchEvent(new Event("input"));

        expect(itemLabels(view)).toEqual(["Alpha node", "Beta node", "Gamma node"]);
    });

    it("shows no items when query matches nothing", () => {
        const view = createView();
        view.setViewData({ nodes: sampleNodes, canvasTitle: "My Canvas" });
        const input: HTMLInputElement = (view as any).contentEl.querySelector(".canvas-parent-nodes-search");

        input.value = "zzz";
        input.dispatchEvent(new Event("input"));

        expect(itemLabels(view)).toEqual([]);
    });
});

describe("ParentNodesView pagination", () => {
    it("is not rendered when the node count fits on one page", () => {
        const view = createView();
        view.setViewData({ nodes: makeNodes(PAGE_SIZE), canvasTitle: "My Canvas" });

        const pagination = (view as any).contentEl.querySelector(".canvas-parent-nodes-pagination");
        expect(pagination?.children.length ?? 0).toBe(0);
        expect(itemLabels(view)).toHaveLength(PAGE_SIZE);
    });

    it("is rendered and shows the first page when the node count exceeds one page", () => {
        const view = createView();
        const total = PAGE_SIZE + 5;
        view.setViewData({ nodes: makeNodes(total), canvasTitle: "My Canvas" });

        const indicator = (view as any).contentEl.querySelector(".canvas-parent-nodes-page-indicator");
        expect(indicator.textContent).toBe("Page 1 of 2");
        expect(itemLabels(view)).toHaveLength(PAGE_SIZE);

        const prevBtn: HTMLButtonElement = (view as any).contentEl.querySelectorAll(".canvas-parent-nodes-page-btn")[0];
        const nextBtn: HTMLButtonElement = (view as any).contentEl.querySelectorAll(".canvas-parent-nodes-page-btn")[1];
        expect(prevBtn.disabled).toBe(true);
        expect(nextBtn.disabled).toBe(false);
    });

    it("navigates to the next and previous page", () => {
        const view = createView();
        const total = PAGE_SIZE + 5;
        view.setViewData({ nodes: makeNodes(total), canvasTitle: "My Canvas" });

        const getButtons = () => (view as any).contentEl.querySelectorAll(".canvas-parent-nodes-page-btn");
        getButtons()[1].dispatchEvent(new Event("click"));

        expect((view as any).contentEl.querySelector(".canvas-parent-nodes-page-indicator").textContent).toBe("Page 2 of 2");
        expect(itemLabels(view)).toHaveLength(5);
        expect(getButtons()[0].disabled).toBe(false);
        expect(getButtons()[1].disabled).toBe(true);

        getButtons()[0].dispatchEvent(new Event("click"));

        expect((view as any).contentEl.querySelector(".canvas-parent-nodes-page-indicator").textContent).toBe("Page 1 of 2");
        expect(itemLabels(view)).toHaveLength(PAGE_SIZE);
    });

    it("resets to page 1 and hides pagination when a search narrows results below one page", () => {
        const view = createView();
        const total = PAGE_SIZE + 5;
        view.setViewData({ nodes: makeNodes(total), canvasTitle: "My Canvas" });

        (view as any).contentEl.querySelectorAll(".canvas-parent-nodes-page-btn")[1].dispatchEvent(new Event("click"));
        expect((view as any).contentEl.querySelector(".canvas-parent-nodes-page-indicator").textContent).toBe("Page 2 of 2");

        const input: HTMLInputElement = (view as any).contentEl.querySelector(".canvas-parent-nodes-search");
        input.value = "Node 01";
        input.dispatchEvent(new Event("input"));

        expect(itemLabels(view)).toEqual(["Node 01"]);
        const pagination = (view as any).contentEl.querySelector(".canvas-parent-nodes-pagination");
        expect(pagination?.children.length ?? 0).toBe(0);
    });

    it("resets to page 1 when new view data is set", () => {
        const view = createView();
        const total = PAGE_SIZE + 5;
        view.setViewData({ nodes: makeNodes(total), canvasTitle: "My Canvas" });
        (view as any).contentEl.querySelectorAll(".canvas-parent-nodes-page-btn")[1].dispatchEvent(new Event("click"));
        expect((view as any).contentEl.querySelector(".canvas-parent-nodes-page-indicator").textContent).toBe("Page 2 of 2");

        view.setViewData({ nodes: makeNodes(total), canvasTitle: "Another Canvas" });

        expect((view as any).contentEl.querySelector(".canvas-parent-nodes-page-indicator").textContent).toBe("Page 1 of 2");
    });
});
