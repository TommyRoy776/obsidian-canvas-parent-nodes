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

const PAGE_SIZE = 15;

export class ParentNodesView extends ItemView {
	private data: ParentNodesViewData = {
		nodes: [],
		message: "Open a canvas to see its root nodes.",
	};
	private currentPage = 1;

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
		this.currentPage = 1;
		this.render();
	}

	private render(): void {
		const container = this.contentEl;
		const titleLength = this.plugin.settings.parentNodeTitleLength;
		container.empty();

		if (this.data.canvasTitle) {
			container.createEl("h3", { text: "Parent nodes of canvas :" });
			container.createEl("h4", { text: this.data.canvasTitle, attr: { style: "font-style: italic;" } });
		} else {
			container.createEl("h3", { text: "Canvas parent nodes" });
		}

		if (this.data.message) {
			container.createEl("p", { text: this.data.message, cls: "canvas-parent-nodes-message" });
		}

		if (this.data.nodes.length === 0) {
			return;
		}

		const searchInput = container.createEl("input", {
			cls: "canvas-parent-nodes-search",
			attr: { type: "text", placeholder: "Search parent node title" },
		});

		const list = container.createEl("ul", { cls: "canvas-parent-nodes-list" });
		const pagination = container.createDiv({ cls: "canvas-parent-nodes-pagination" });

		const renderPage = () => {
			const query = searchInput.value.toLowerCase();
			const filtered = this.data.nodes.filter((node) => node.label.toLowerCase().includes(query));
			const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
			this.currentPage = Math.min(Math.max(this.currentPage, 1), totalPages);

			const start = (this.currentPage - 1) * PAGE_SIZE;
			const pageItems = filtered.slice(start, start + PAGE_SIZE);

			list.empty();
			for (const node of pageItems) {
				const item = list.createEl("li", { cls: "canvas-parent-nodes-item" });
				let label = node.label.replace(/[^\p{L}\p{N}\s!?.,;:'"()-]+/gu, '');
				if (label.length > titleLength) {
					label = label.substring(0, titleLength) + '...';
				}
				item.createSpan({ cls: "canvas-parent-nodes-label", text: label });
				item.createSpan({ cls: "canvas-parent-nodes-type", text: node.type });
				item.addEventListener("click", () => {
					void zoomToNode(this.plugin, node.id);
				});
			}

			pagination.empty();
			if (filtered.length > PAGE_SIZE) {
				const prevBtn = pagination.createEl("button", { cls: "canvas-parent-nodes-page-btn", text: "Previous" });
				prevBtn.disabled = this.currentPage <= 1;
				prevBtn.addEventListener("click", () => {
					this.currentPage -= 1;
					renderPage();
				});

				pagination.createSpan({
					cls: "canvas-parent-nodes-page-indicator",
					text: `Page ${this.currentPage} of ${totalPages}`,
				});

				const nextBtn = pagination.createEl("button", { cls: "canvas-parent-nodes-page-btn", text: "Next" });
				nextBtn.disabled = this.currentPage >= totalPages;
				nextBtn.addEventListener("click", () => {
					this.currentPage += 1;
					renderPage();
				});
			}
		};

		searchInput.addEventListener("input", () => {
			this.currentPage = 1;
			renderPage();
		});

		renderPage();
	}
}
