import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import { AppSearchProvider } from "resource:///org/gnome/shell/ui/appDisplay.js";
import VSCodeSearchProvider from "./provider.js";

export default class VSCodeSearchProviderExtension extends Extension {
  provider: AppSearchProvider | null = null;
  enable() {
    this.provider = new VSCodeSearchProvider(this);
    Main.overview.searchController.addProvider(this.provider);
  }

  disable() {
    if (this.provider) {
      Main.overview.searchController.removeProvider(this.provider);
      this.provider = null;
    }
  }
}
