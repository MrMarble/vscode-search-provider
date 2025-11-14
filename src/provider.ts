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
  T extends Extension & {
    _settings: Gio.Settings | null;
  },
> implements AppSearchProvider
{
  workspaces: Record<string, { name: string; path: string }> = {};
  extension: T;
  app: Shell.App | undefined;
  appInfo: Gio.DesktopAppInfo | undefined;
  // Set by the SearchProvider interface
  display: unknown;

  constructor(extension: T) {
    this.extension = extension;
    this._setApp();
    this.appInfo = this.app?.appInfo;
    this._setWorkspaces();
  }

  _setWorkspaces() {
    const codeConfig = this._getConfig();
    if (!codeConfig) {
      console.error("Failed to read vscode storage.json");
      return;
    }

    const addSuffix = this.extension?._settings?.get_boolean("suffix");
    const workspaceTypes = [
      {
        type: "dev-container",
        enabled: this.extension?._settings?.get_boolean(
          "include-dev-containers",
        ),
        isWorkspaceType: (path: string) =>
          path.startsWith("vscode-remote://dev-container"),
        makeDisplayName: (name: string) =>
          name + (addSuffix ? " [Dev Container]" : ""),
      },
      {
        type: "codespace",
        enabled: this.extension?._settings?.get_boolean("include-code-spaces"),
        isWorkspaceType: (path: string) =>
          path.startsWith("vscode-remote://codespaces"),
        makeDisplayName: (name: string) =>
          name + (addSuffix ? " [Codespaces]" : ""),
      },
      {
        type: "github",
        enabled: this.extension?._settings?.get_boolean("include-github"),
        isWorkspaceType: (path: string) =>
          path.startsWith("vscode-vfs://github"),
        makeDisplayName: (name: string) =>
          name + (addSuffix ? " [Github]" : ""),
      },
      {
        type: "remote",
        enabled: true,
        isWorkspaceType: (path: string) => path.startsWith("vscode-remote://"),
        makeDisplayName: (name: string) =>
          name + (addSuffix ? " [Remote]" : ""),
      },
      {
        type: "default",
        enabled: true,
        isWorkspaceType: () => true,
        makeDisplayName: (name: string) => name,
      },
    ];

    const paths = Object.keys(codeConfig.profileAssociations.workspaces);
    const validWorkspaces = paths
      .map(decodeURIComponent)
      .map((path) => ({
        path,
        type: workspaceTypes.find((type) => type.isWorkspaceType(path))!,
      }))
      .filter(({ type }) => type.enabled)
      .map(({ path, type }) => ({
        name: type
          .makeDisplayName(path.split("/").pop()!)
          .replace(".code-workspace", " Workspace"),
        path: path.replace("file://", ""),
      }));

    this.workspaces = {};
    for (const workspace of validWorkspaces) {
      this.workspaces[uniqueId()] = workspace;
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

  _setApp() {
    this.app = [
      "code",
      "code-insiders",
      "code-oss",
      "codium",
      "codium-insiders",
      "com.vscodium.codium",
      "com.vscodium.codium-insiders",
    ]
      .map((id) => Shell.AppSystem.get_default().lookup_app(id + ".desktop"))
      .find((app) => Boolean(app));

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

  filterResults(results: string[], maxResults: number) {
    return results.slice(0, maxResults);
  }

  async getInitialResultSet(terms: string[]) {
    this._setWorkspaces();
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
      name: this.workspaces[id].name,
      description: this.workspaces[id].path,
      createIcon: (size: number) => this.app?.create_icon_texture(size),
    }));
  }
}
