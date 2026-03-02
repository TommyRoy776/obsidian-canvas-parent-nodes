import { ItemView, Plugin, TAbstractFile, TFile, WorkspaceLeaf, View } from "obsidian";
import type { AllCanvasNodeData, CanvasData } from "obsidian/canvas";
import { CanvasParentNodesSettings, DEFAULT_SETTINGS, CanvasParentNodesSettingTab } from "./settings";
import { ParentNodesView, VIEW_TYPE_PARENT_NODES, ParentNodesViewData, ParentNodeInfo } from "./parent-nodes-view";

export default class CanvasParentNodesPlugin extends Plugin {
	settings: CanvasParentNodesSettings;
	private parentNodesView: ParentNodesView | null = null;
	private currentCanvasView: any = null;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new CanvasParentNodesSettingTab(this.app, this));
		this.registerView(VIEW_TYPE_PARENT_NODES, (leaf) => new ParentNodesView(leaf, this));

		this.registerEvent(this.app.workspace.on("active-leaf-change", () => {
			void this.refreshParentNodes();
		}));
		this.registerEvent(this.app.workspace.on("file-open", () => {
			void this.refreshParentNodes();
		}));
		this.registerEvent(this.app.vault.on("modify", (file) => {
			if (this.isCanvasFile(file) && file === this.app.workspace.getActiveFile()) {
				void this.refreshParentNodes();
			}
		}));

		this.app.workspace.onLayoutReady(() => {
			void this.activateParentNodesLeaf();
			void this.refreshParentNodes();
		});
	}

	onunload() {

	}

	registerParentNodesView(view: ParentNodesView) {
		this.parentNodesView = view;
		void this.refreshParentNodes();
	}

	unregisterParentNodesView(view: ParentNodesView) {
		if (this.parentNodesView === view) {
			this.parentNodesView = null;
		}
	}

	private async activateParentNodesLeaf() {
		const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_PARENT_NODES);
		if (existing.length > 0) {
			return;
		}
		const leaf: WorkspaceLeaf | null = this.app.workspace.getRightLeaf(false) ?? this.app.workspace.getRightLeaf(true);
		if (!leaf) {
			return;
		}
		await leaf.setViewState({ type: VIEW_TYPE_PARENT_NODES, active: false });
		await this.app.workspace.revealLeaf(leaf);
	}

	private async refreshParentNodes() {
		if (!this.parentNodesView) {
			return;
		}
		const data = await this.getParentNodesViewData();
		this.parentNodesView.setViewData(data);
	}

	private async getParentNodesViewData(): Promise<ParentNodesViewData> {
		const file = this.app.workspace.getActiveFile();
		if (!this.isCanvasFile(file)) {
			return {
				nodes: [],
				message: "Open a canvas to see its root nodes.",
			};
		}

		try {
			const raw = await this.app.vault.read(file);
			const parsed = JSON.parse(raw) as CanvasData;
			this.currentCanvasView = this.app.workspace.getActiveViewOfType(ItemView)
			const nodes = parsed.nodes ?? [];
			const edges = parsed.edges ?? [];
			const nodesWithIncoming = new Set(edges.map((edge) => edge.toNode));
			const rootNodes = nodes
				.filter((node) => !nodesWithIncoming.has(node.id))
				.map((node) => this.toParentNodeInfo(node))
				.sort((a, b) => a.label.localeCompare(b.label));

			return {
				nodes: rootNodes,
				canvasTitle: file.basename,
				message: rootNodes.length === 0 ? "This canvas has no root nodes." : undefined,
			};
		} catch (error) {
			console.error("Failed to parse canvas file", error);
			return {
				nodes: [],
				canvasTitle: file.basename,
				message: "Unable to parse the current canvas file.",
			};
		}
	}

	private toParentNodeInfo(node: AllCanvasNodeData): ParentNodeInfo {
		return {
			id: node.id,
			label: this.getNodeLabel(node),
			type: node.type,
		};
	}

	private getNodeLabel(node: AllCanvasNodeData): string {
		const labeledNode = node as { label?: string };
		if (typeof labeledNode.label === "string" && labeledNode.label.trim().length > 0) {
			return labeledNode.label.trim();
		}

		if (node.type === "text" && typeof node.text === "string") {
			const trimmed = node.text.trim();
			if (trimmed.length > 0) {
				const firstLine = trimmed.split(/\r?\n/, 1)[0];
				return firstLine ?? trimmed;
			}
		}

		if (node.type === "file" && typeof node.file === "string") {
			const fileName = node.file.split("/").pop();
			return fileName ?? node.file;
		}

		if (node.type === "link" && typeof node.url === "string") {
			return node.url;
		}

		return `${node.type} (${node.id.slice(0, 6)})`;
	}

	private isCanvasFile(file: TAbstractFile | null | undefined): file is TFile {
		return file instanceof TFile && file.extension === "canvas";
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<CanvasParentNodesSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	get CurrentCanvasData(): CanvasData | null {
		return this.currentCanvasData;
	}

	getActiveCanvas(): any | null {
		console.log('canvasView',this.currentCanvasView)
		return this.currentCanvasView?.canvas ?? null;
	}
}

