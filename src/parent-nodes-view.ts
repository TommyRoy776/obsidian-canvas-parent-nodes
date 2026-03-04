import { ItemView, WorkspaceLeaf } from "obsidian";
import type CanvasParentNodesPlugin from "./main";
import { zoomToNode } from "helper";

export const VIEW_TYPE_PARENT_NODES = "canvas-parent-nodes-view";

export interface ParentNodeInfo {
	id: string;
	label: string;
	type: string;
}

export interface ParentNodesViewData {
	nodes: ParentNodeInfo[];
	canvasTitle?: string;
	message?: string;
}

export class ParentNodesView extends ItemView {
	private data: ParentNodesViewData = {
		nodes: [],
		message: "Open a canvas to see its root nodes.",
	};

	constructor(leaf: WorkspaceLeaf, private readonly plugin: CanvasParentNodesPlugin) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_PARENT_NODES;
	}

	getDisplayText(): string {
		return "Canvas parent nodes";
	}

	getIcon(): string {
		return "clipboard-list";
	}

	async onOpen(): Promise<void> {
		this.contentEl.addClass("canvas-parent-nodes-view");
		this.plugin.registerParentNodesView(this);
		this.render();
	}

	async onClose(): Promise<void> {
		this.plugin.unregisterParentNodesView(this);
		this.contentEl.empty();
	}

	setViewData(data: ParentNodesViewData): void {
		this.data = data;
		this.render();
	}

	private render(): void {
		const container = this.contentEl;
		const titleLength = this.plugin.settings.parentNodeTitleLength;
		container.empty();

		const headingText = this.data.canvasTitle
			? `Parent nodes of canvas : ${this.data.canvasTitle}`
			: "Canvas parent nodes";
		container.createEl("h3", { text: headingText });

		if (this.data.message) {
			container.createEl("p", { text: this.data.message, cls: "canvas-parent-nodes-message" });
		}

		if (this.data.nodes.length === 0) {
			return;
		}

		const list = container.createEl("ul", { cls: "canvas-parent-nodes-list" });
		for (const node of this.data.nodes) {
			const item = list.createEl("li", { cls: "canvas-parent-nodes-item" });
			let label = node.label.replace(/[^\p{L}\p{N}\s]+/gu, '');
            if(label.length > titleLength) {
                label = label.substring(0, titleLength) + '...';
            }
			item.createSpan({ cls: "canvas-parent-nodes-label", text: label });
			item.createSpan({ cls: "canvas-parent-nodes-type", text: node.type });
            item.addEventListener("click", () => {
				console.log(`Zooming to node ${node.id}...`);
                void zoomToNode(this.plugin, node.id);
            });
		}
	}
}
