module.exports = [
  {
    // Ignore build and dependency folders
    ignores: ["dist/**", "coverage/**", "node_modules/**"]
  },
  {
    // Apply to all TypeScript files
    files: ["**/*.ts"],
    languageOptions: {
      // Use the actual parser module instead of a string so ESLint can call parse()/parseForESLint()
      parser: require("@typescript-eslint/parser"),
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module",
        ecmaVersion: "latest"
      }
    },
    plugins: {
      "@typescript-eslint": require("@typescript-eslint/eslint-plugin"),
      "prettier": require("eslint-plugin-prettier")
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "prettier/prettier": [
        "error",
        {
          quoteProps: "consistent"
        }
      ],
    }
  }
];