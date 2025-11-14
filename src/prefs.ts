import Gio from "gi://Gio";
import Adw from "gi://Adw";

import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

type Window = Adw.PreferencesWindow & {
  _settings: Gio.Settings | null;
};

export default class ExamplePreferences extends ExtensionPreferences {
  _settings: Gio.Settings | null = null;

  fillPreferencesWindow(window: Window) {
    // Create a settings object
    window._settings = this.getSettings();
    // Create a preferences page, with a single group
    const page = new Adw.PreferencesPage({
      title: _("General"),
      icon_name: "dialog-information-symbolic",
    });
    window.add(page);

    const group = new Adw.PreferencesGroup({
      title: _("Appearance"),
      description: _("Configure the appearance of the extension"),
    });

    page.add(group);

    const overrideResultsOrder = new Adw.SwitchRow({
      title: _("Override Results Order"),
      subtitle: _(
        "If enabled, the extension will override the default search results order to prioritize VS Code workspaces. Will place the results directly underneath applications. Requires disabling and re-enabling the extension to take effect.",
      ),
    });
    group.add(overrideResultsOrder);
    window._settings.bind(
      "override-results-order",
      overrideResultsOrder,
      "active",
      Gio.SettingsBindFlags.DEFAULT,
    );

    const showSuffix = new Adw.SwitchRow({
      title: _("Show Suffix"),
      subtitle: _(
        "Whether to show a suffix next to the workspace name. (Remote, Codespaces...)",
      ),
    });
    group.add(showSuffix);
    window._settings.bind(
      "suffix",
      showSuffix,
      "active",
      Gio.SettingsBindFlags.DEFAULT,
    );

    const includeDevContainers = new Adw.SwitchRow({
      title: _("Include Dev Containers"),
      subtitle: _("Whether to include dev containers in the workspace list."),
    });
    group.add(includeDevContainers);
    window._settings.bind(
      "include-dev-containers",
      includeDevContainers,
      "active",
      Gio.SettingsBindFlags.DEFAULT,
    );

    const includeCodeSpaces = new Adw.SwitchRow({
      title: _("Include Code Spaces"),
      subtitle: _("Whether to include code spaces in the workspace list."),
    });
    group.add(includeCodeSpaces);
    window._settings.bind(
      "include-code-spaces",
      includeCodeSpaces,
      "active",
      Gio.SettingsBindFlags.DEFAULT,
    );

    const includeGithub = new Adw.SwitchRow({
      title: _("Include GitHub Virtual File Systems"),
      subtitle: _(
        "Whether to include GitHub Virtual File Systems in the workspace list.",
      ),
    });
    group.add(includeGithub);
    window._settings.bind(
      "include-github",
      includeGithub,
      "active",
      Gio.SettingsBindFlags.DEFAULT,
    );
  }
}
