import Glib from "gi://GLib";
import Gio from "gi://Gio";
import Shell from "gi://Shell";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import { AppSearchProvider } from "resource:///org/gnome/shell/ui/appDisplay.js";
import { readFile, uniqueId } from "./util.js";

interface VSStorage {
  profileAssociations: {
    workspaces: Record<string, string>;
  };
}

export default class VSCodeSearchProvider implements AppSearchProvider {
  workspaces: Record<string, { name: string; path: string }> = {};
  extension: Extension;
  app: Shell.App | null = null;
  appInfo: Gio.DesktopAppInfo | undefined;

  constructor(extension: Extension) {
    this.extension = extension;

    const configDir = Glib.get_user_config_dir();
    const vscStorage = readFile(
      `${configDir}/Code/User/globalStorage/storage.json`
    );
    if (!vscStorage) {
      console.error("Could not read VSCode storage file");
      return;
    }
    const codeConfig: VSStorage = JSON.parse(vscStorage);

    const paths = Object.keys(codeConfig.profileAssociations.workspaces).sort();

    for (const path of paths) {
      const name = path.split("/").pop()!;
      this.workspaces[uniqueId()] = { name, path: path.replace("file://", "") };
    }

    const ids = ["code", "code-insiders", "code-oss"];
    for (let i = 0; !this.app && i < ids.length; i++) {
      this.app = Shell.AppSystem.get_default().lookup_app(ids[i] + ".desktop");
    }
    if (!this.app) {
      console.log("Failed to find vscode application");
    }

    this.appInfo = this.app?.appInfo;
  }

  activateResult(result: string): void {
    if (this.app) {
      this.app?.app_info.launch(
        [Gio.file_new_for_path(this.workspaces[result].path)],
        null
      );
    }
  }

  filterResults(results: string[], maxResults: number) {
    return results.slice(0, maxResults);
  }

  async getInitialResultSet(terms: string[]) {
    return Object.keys(this.workspaces).filter((id) =>
      this.workspaces[id].name.includes(terms.join(""))
    );
  }

  async getSubsearchResultSet(previousResults: string[], terms: string[]) {
    return previousResults.filter((id) =>
      this.workspaces[id].name.includes(terms.join(""))
    );
  }

  async getResultMetas(ids: string[]) {
    return ids.map((id) => ({
      id,
      name: this.workspaces[id].name,
      description: this.workspaces[id].path,
      createIcon: (size: number) => this.app?.create_icon_texture(size),
    }));
  }
}
