import { readFileSync } from "fs";

enum FileTest {
  EXISTS,
}

export default {
  AppSystem: {
    get_default() {
      return {
        lookup_app() {
          return {};
        },
      };
    },
  },
  get_user_config_dir() {},
  get_home_dir() {},
  FileTest,
  file_test() {
    return true;
  },
  file_get_contents() {
    return [true, readFileSync("tests/fixtures/storage.json")];
  },
};
