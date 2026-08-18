export default [
  {
    ignores: ["**/dist/**", "**/out/**", "**/node_modules/**", "**/coverage/**"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-unused-vars": "off",
      "no-console": "off"
    }
  }
];
