import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: ["coverage/**", "node_modules/**", "public/**", "cypress/**", "report/**", "reports/**"]
  },
  { 
    files: 
    ["**/*.{js,mjs,cjs}"], 
    plugins: { js }, 
    extends: ["js/recommended"],
    languageOptions: { 
      globals: {
        ...globals.node,
        ...globals.jest,
      }
    },
    rules: {
      "complexity": ["error", 25],
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "no-undef": "error"
    }
  },
]);
