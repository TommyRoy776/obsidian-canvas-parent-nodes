import {App, PluginSettingTab, Setting, SliderComponent, TextComponent} from "obsidian";
import MyPlugin from "./main";

export interface CanvasParentNodesSettings {
	parentNodeTitleLength: number;
}

export const DEFAULT_SETTINGS: CanvasParentNodesSettings = {
	parentNodeTitleLength: 20
}

export class CanvasParentNodesSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		let sliderComponent: SliderComponent | undefined;
		let textComponent: TextComponent | undefined;

		// new Setting(containerEl)
		// 	.setName('Settings #1')
		// 	.setDesc('It\'s a secret')
		// 	.addText(text => text
		// 		.setPlaceholder('Enter your secret')
		// 		.setValue(this.plugin.settings.mySetting)
		// 		.onChange(async (value) => {
		// 			this.plugin.settings.mySetting = value;
		// 			await this.plugin.saveSettings();
		// 		}));
		new Setting(containerEl)
			.setName('Parent node title length')
			.setDesc('Range from 20 to 50')
			.addSlider(slider => {
				sliderComponent = slider;
				slider
					.setLimits(20, 50, 1)
					.setValue(this.plugin.settings.parentNodeTitleLength)
					.onChange(async (value) => {
						this.plugin.settings.parentNodeTitleLength = value;
						await this.plugin.saveSettings();
						textComponent?.setValue(value.toString());
					});
			})
			.addText(text => {
				textComponent = text;
				text
					.setPlaceholder('Enter a number between 20 and 50')
					.setValue(this.plugin.settings.parentNodeTitleLength.toString())
					.onChange(async (value) => {
						const num = parseInt(value);
						if (!isNaN(num) && num >= 20 && num <= 50) {
							this.plugin.settings.parentNodeTitleLength = num;
							await this.plugin.saveSettings();
							sliderComponent?.setValue(num);
						}
					});
			});
	}
}
