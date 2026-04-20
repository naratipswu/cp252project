import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: ["coverage/**", "node_modules/**", "public/**", "cypress/**"]
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
      "complexity": ["error", 10] // ถ้าฟังก์ชันไหนซับซ้อนเกิน 10 มันจะฟ้อง
    }
  },
]);
