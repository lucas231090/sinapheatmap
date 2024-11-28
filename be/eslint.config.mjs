import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "commonjs" },
    rules: {
      "no-unused-vars": "off",
    },
  },
  {
    languageOptions: { globals: globals.node },
    rules: {
      "no-unused-vars": "off",
    },
  },
  pluginJs.configs.recommended,
];
