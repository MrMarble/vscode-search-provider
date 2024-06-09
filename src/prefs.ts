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

    // Create a new preferences row
    const row = new Adw.SwitchRow({
      title: _("Show Suffix"),
      subtitle: _(
        "Whether to show a suffix next to the workspace name. (Remote, Codespaces...)",
      ),
    });
    group.add(row);

    // Create a settings object and bind the row to the `show-indicator` key
    window._settings = this.getSettings();
    window._settings.bind(
      "suffix",
      row,
      "active",
      Gio.SettingsBindFlags.DEFAULT,
    );
  }
}
