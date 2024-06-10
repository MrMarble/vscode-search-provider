import { test } from "uvu";
import * as assert from "uvu/assert";
import Provider from "../src/provider";

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

test("should ignore dev-containers", () => {
  const provider = new Provider();
  const workspace = Object.keys(provider.workspaces).find((key) => {
    return provider.workspaces[key].path.includes("dev-containers");
  });

  assert.ok(
    typeof workspace === "undefined",
    `expected undefined but got ${provider.workspaces[workspace]?.path}`,
  );
});

test("should not add suffix if disabled", async () => {
  const provider = new Provider();

  const workspaceId = Object.keys(provider.workspaces).find((key) => {
    return provider.workspaces[key].path.includes(
      "codespaces+musical-umbrella",
    );
  });

  const meta = await provider.getResultMetas([workspaceId]);

  assert.equal(meta[0].name, "vscode-search-provider");
});

[
  ["vscode-search-provider [Codespaces]", "codespaces+musical-umbrella"],
  ["vscode-search-provider [Remote]", "/ts/vscode-search-provider"],
  ["vscode-search-provider [Github]", "/mrmarble/vscode-search-provider"],
  ["Marlin-2.0.x", "Marlin"],
].forEach(([name, path]) => {
  test(`should add suffix for ${name}`, async () => {
    const provider = new Provider({
      _settings: {
        get_boolean: () => true,
      },
    });

    const workspaceId = Object.keys(provider.workspaces).find((key) => {
      return provider.workspaces[key].path.includes(path);
    });

    const meta = await provider.getResultMetas([workspaceId]);

    assert.equal(meta[0].name, name);
  });
});

test.run();
