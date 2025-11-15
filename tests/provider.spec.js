import { test } from "uvu";
import * as assert from "uvu/assert";
import Provider from "../src/provider";

const findWorkspace = (provider, pathFragment, name) => {
  return Object.values(provider.workspaces).find((workspace) => {
    return workspace.path.includes(pathFragment) && workspace.name === name;
  });
};

test("should return instance of provider", () => {
  const provider = new Provider();
  assert.instance(provider, Provider);
});

test("should read workspaces", () => {
  const provider = new Provider();

  assert.ok(Object.keys(provider.workspaces).length > 0);
});

test("should decode uri", () => {
  const provider = new Provider();
  const workspace = Object.keys(provider.workspaces).find((key) => {
    return provider.workspaces[key].path.includes("%2B");
  });

  assert.ok(
    typeof workspace === "undefined",
    `expected undefined but got ${provider.workspaces[workspace]?.path}`,
  );
});

[
  ["vscode-search-provider [Remote]", "/ts/vscode-search-provider"],
  ["Marlin-2.0.x", "Marlin"],
].forEach(([name, path]) => {
  test(`should add suffix for ${name}`, async () => {
    const provider = new Provider({
      _settings: {
        get_boolean: (key) => key === "suffix",
      },
    });

    assert.ok(
      findWorkspace(provider, path, name),
      `workspace ${name}:${path} expected`,
    );
  });
});

[
  [
    "vscode-search-provider [Codespaces]",
    "codespaces+musical-umbrella",
    ["include-code-spaces", "suffix"],
  ],
  [
    "vscode-search-provider",
    "codespaces+musical-umbrella",
    ["include-code-spaces"],
  ],
  [
    "vscode-search-provider [Github]",
    "/mrmarble/vscode-search-provider",
    ["include-github", "suffix"],
  ],
  [
    "vscode-search-provider",
    "/mrmarble/vscode-search-provider",
    ["include-github"],
  ],
  [
    "typescript-node [Dev Container]",
    "/workspaces/typescript-node",
    ["include-dev-containers", "suffix"],
  ],
  [
    "typescript-node",
    "/workspaces/typescript-node",
    ["include-dev-containers"],
  ],
].forEach(([name, path, enabledSettings]) => {
  test(`should enable and disable workspace type for ${name}`, async () => {
    // Check workspace does not exist when settings are disabled
    let provider = new Provider();
    assert.not.ok(
      findWorkspace(provider, path, name),
      `workspace ${name}:${path} should not be found when settings ${enabledSettings} are disabled`,
    );

    // Check workspace exists when settings are enabled
    provider = new Provider({
      _settings: {
        get_boolean: (key) => enabledSettings.includes(key),
      },
    });

    assert.ok(
      findWorkspace(provider, path, name),
      `workspace ${name}:${path} should be found when settings ${enabledSettings} are enabled`,
    );
  });
});

test.run();
