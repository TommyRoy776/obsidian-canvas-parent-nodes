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

export async function zoomToNode(plugin: CanvasParentNodesPlugin, nodeId: string) {
    const canvasData = plugin.CurrentCanvasData;
    if (!canvasData) {
        return;
    }

    const node = canvasData.nodes.find((n) => n.id === nodeId);
    if (!node) {
        return;
    }

    const canvas = plugin.getActiveCanvas();
    if (!runtime) {
        console.log(runtime)
        console.warn("Canvas runtime API unavailable; cannot zoom to node.");
        return;
    }

    const paddingFactor = 1.1;
    const bbox: ZoomBoundingBox = {
        minX: node.x - node.width * paddingFactor,
        minY: node.y - node.height * paddingFactor,
        maxX: node.x + node.width * paddingFactor,
        maxY: node.y + node.height * paddingFactor,
    };

    if (typeof runtime.zoomToBbox === "function") {
        runtime.zoomToBbox(bbox);
    } else if (typeof runtime.zoomTo === "function") {
        runtime.zoomTo(node.x, node.y, paddingFactor);
    }

    const runtimeNode = runtime.nodes?.get?.(node.id);
    if (typeof runtime.deselectAll === "function") {
        runtime.deselectAll();
    }
    if (runtimeNode) {
        if (typeof runtime.selectOnly === "function") {
            runtime.selectOnly(runtimeNode);
        } else if (typeof runtime.select === "function") {
            runtime.select(runtimeNode);
        }
    }
}