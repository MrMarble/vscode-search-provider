import Gio from "gi://Gio";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import { AppSearchProvider } from "resource:///org/gnome/shell/ui/appDisplay.js";
import VSCodeSearchProvider from "./provider.js";

export default class VSCodeSearchProviderExtension extends Extension {
  provider: AppSearchProvider | null = null;
  _settings: Gio.Settings | null = null;

  enable() {
    this._settings = this.getSettings();
    this.provider = new VSCodeSearchProvider(this);
    Main.overview.searchController.addProvider(this.provider);

    if (this._settings?.get_boolean("override-results-order")) {
      const searchResults = Main.overview.searchController._searchResults;
      // Rearrange the search results to put our provider just after apps.
      searchResults._content.remove_child(this.provider.display);
      searchResults._content.insert_child_at_index(this.provider.display, 1);
      // Switch the providers order so it selects the first item in this provider by default.
      searchResults._providers.splice(1, 0, this.provider);
      searchResults._providers.pop();
    }
  }

  disable() {
    this._settings = null;
    if (this.provider) {
      Main.overview.searchController.removeProvider(this.provider);
      this.provider = null;
    }
  }
}
