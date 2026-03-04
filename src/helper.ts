import { ItemView, TFile } from "obsidian";
import type CanvasParentNodesPlugin from "./main";

type CanvasRuntimeLike = {
    zoomToBbox?: (box: ZoomBoundingBox) => void;
    zoomTo?: (x: number, y: number, scale?: number) => void;
    deselectAll?: () => void;
    selectOnly?: (node: unknown) => void;
    select?: (node: unknown) => void;
    nodes?: Map<string, unknown> & { get?(id: string): unknown };
};

interface ZoomBoundingBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

interface CanvasViewWithRuntime {
    canvas?: CanvasRuntimeLike;
}

export interface CanvasView extends ItemView {
    _loaded: boolean
    file: TFile
    canvas: any
    leaf: any

    getViewData(): string
    setViewData(data: string): void

    close(): void

    data: string
    lastSavedData: string
    requestSave(): void
}

export async function zoomToNode(plugin: CanvasParentNodesPlugin, nodeId: string) {
    const canvas = plugin.getActiveCanvas();
    console.log("Current canvas data:", canvas);
    if (!canvas) {
        console.warn("Canvas runtime API unavailable; cannot zoom to node.");
        return;
    }

    const node = canvas.data.nodes.find((n) => n.id === nodeId);
    if (!node) {
        return;
    }

    canvas.zoomToBbox({
        minX: node.x - node.width * 1,
        minY: node.y - node.height * 1,
        maxX: node.x + node.width * 1,
        maxY: node.y + node.height * 1,
    });
    let target = canvas.nodes.get(node.id);
    canvas.deselectAll();
    canvas.select(target);
}