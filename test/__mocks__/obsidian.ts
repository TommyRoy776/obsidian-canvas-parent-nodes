export class TAbstractFile {
    path = "";
    name = "";
}

export class TFile extends TAbstractFile {
    extension = "";
    basename = "";
}

export class View {
    contentEl: unknown = {};
    getViewType(): string {
        return "";
    }
}

export class ItemView extends View {
    constructor(_leaf: unknown) {
        super();
    }
}

export class WorkspaceLeaf {}

export class App {}

export class Plugin {
    app: unknown;
    manifest: unknown;

    constructor(app: unknown, manifest: unknown) {
        this.app = app;
        this.manifest = manifest;
    }

    addSettingTab(_tab: unknown): void {}
    registerView(_type: string, _factory: unknown): void {}
    registerEvent(_eventRef: unknown): void {}
    loadData(): Promise<unknown> {
        return Promise.resolve({});
    }
    saveData(_data: unknown): Promise<void> {
        return Promise.resolve();
    }
}

export class PluginSettingTab {
    containerEl: unknown = {};
    constructor(_app: unknown, _plugin: unknown) {}
}

export class Setting {
    constructor(_containerEl: unknown) {}
    setName(): this { return this; }
    setDesc(): this { return this; }
    addSlider(): this { return this; }
    addText(): this { return this; }
}

export class SliderComponent {}
export class TextComponent {}
