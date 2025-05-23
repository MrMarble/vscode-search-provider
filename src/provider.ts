import Glib from "gi://GLib";
import Gio from "gi://Gio";
import Shell from "gi://Shell";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import { AppSearchProvider } from "resource:///org/gnome/shell/ui/appDisplay.js";
import { fileExists, readFile, uniqueId } from "./util.js";

interface VSStorage {
  profileAssociations: {
    workspaces: Record<string, string>;
  };
}

export default class VSCodeSearchProvider<
  T extends Extension & { _settings: Gio.Settings | null },
> implements AppSearchProvider
{
  workspaces: Record<string, { name: string; path: string }> = {};
  extension: T;
  app: Shell.App | null = null;
  appInfo: Gio.DesktopAppInfo | undefined;

  constructor(extension: T) {
    this.extension = extension;
    this._findApp();
    this._loadWorkspaces();
    this.appInfo = this.app?.appInfo;
  }

  _loadWorkspaces() {
    const codeConfig = this._getConfig();
    if (!codeConfig) {
      console.error("Failed to read vscode storage.json");
      return;
    }

    const paths = Object.keys(codeConfig.profileAssociations.workspaces).sort();

    this.workspaces = {};
    for (const path of paths.map(decodeURIComponent)) {
      if (path.startsWith("vscode-remote://dev-container")) {
        continue;
      }
      const name = path.split("/").pop()!;
      this.workspaces[uniqueId()] = {
        name: name.replace(".code-workspace", " Workspace"),
        path: path.replace("file://", ""),
      };
    }
  }

  _getConfig(): VSStorage | undefined {
    const configDirs = [
      Glib.get_user_config_dir(),
      `${Glib.get_home_dir()}/.var/app`,
    ];

    const appDirs = [
      // XDG_CONFIG_DIRS
      "Code",
      "Code - Insiders",
      "VSCodium",
      "VSCodium - Insiders",

      // Flatpak
      "com.vscodium.codium/config/VSCodium",
      "com.vscodium.codium-insiders/config/VSCodium - Insiders",
    ];

    for (const configDir of configDirs) {
      for (const appDir of appDirs) {
        const path = `${configDir}/${appDir}/User/globalStorage/storage.json`;
        if (!fileExists(path)) {
          continue;
        }

        const storage = readFile(path);

        if (storage) {
          return JSON.parse(storage);
        }
      }
    }
  }

  _findApp() {
    const ids = [
      "code",
      "code-insiders",
      "code-oss",
      "codium",
      "codium-insiders",
      "com.vscodium.codium",
      "com.vscodium.codium-insiders",
    ];

    for (let i = 0; !this.app && i < ids.length; i++) {
      this.app = Shell.AppSystem.get_default().lookup_app(ids[i] + ".desktop");
    }

    if (!this.app) {
      console.error("Failed to find vscode application");
    }
  }

  activateResult(result: string): void {
    if (this.app) {
      const path = this.workspaces[result].path;
      if (
        path.startsWith("vscode-remote://") ||
        path.startsWith("vscode-vfs://")
      ) {
        const lastSegment = path.split("/").pop();
        const type = lastSegment?.slice(1)?.includes(".") ? "file" : "folder";

        const command =
          this.app?.app_info.get_executable() + " --" + type + "-uri " + path;
        Glib.spawn_command_line_async(command);
      } else {
        this.app?.app_info.launch([Gio.file_new_for_path(path)], null);
      }
    }
  }

  _customSuffix(path: string) {
    if (!this.extension?._settings?.get_boolean("suffix")) {
      return "";
    }

    const prefixes = {
      "vscode-remote://codespaces": "[Codespaces]",
      "vscode-remote://": "[Remote]",
      "vscode-vfs://github": "[Github]",
    };

    for (const prefix of Object.keys(prefixes)) {
      if (path.startsWith(prefix)) {
        return " " + prefixes[prefix as keyof typeof prefixes];
      }
    }

    return "";
  }

  filterResults(results: string[], maxResults: number) {
    return results.slice(0, maxResults);
  }

  async getInitialResultSet(terms: string[]) {
    this._loadWorkspaces();
    const searchTerm = terms.join("").toLowerCase();
    return Object.keys(this.workspaces).filter((id) =>
      this.workspaces[id].name.toLowerCase().includes(searchTerm),
    );
  }

  async getSubsearchResultSet(previousResults: string[], terms: string[]) {
    const searchTerm = terms.join("").toLowerCase();
    return previousResults.filter((id) =>
      this.workspaces[id].name.toLowerCase().includes(searchTerm),
    );
  }

  async getResultMetas(ids: string[]) {
    return ids.map((id) => ({
      id,
      name:
        this.workspaces[id].name + this._customSuffix(this.workspaces[id].path),
      description: this.workspaces[id].path,
      createIcon: (size: number) => this.app?.create_icon_texture(size),
    }));
  }
}
