import js from "@eslint/js";

export default [
  js.configs.recommended,

  {
    files: ["src/**/*.js", "scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
      },
    },
    env: {
      node: true,
      jest: true, // 這一行很重要！
    },
    extends: [
      "plugin:prettier/recommended", // 這行最重要
    ],
    rules: {
      "no-console": "off",
      "no-undef": "off",
      "no-unused-vars": ["off", { argsIgnorePattern: "^_" }],
      "prefer-const": "error",
      "no-var": "error",
      semi: ["error", "always"],
      quotes: ["error", "double"],
      indent: ["error", 2],
      "comma-dangle": ["error", "always-multiline"],
    },
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        jest: "readonly",
        console: "readonly",
        process: "readonly",
      },
    },
  },
  {
    files: ["test-manual.js", "*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
      },
    },
    rules: {
      "no-console": "off",
      "no-undef": "off",
      semi: ["error", "always"],
      quotes: ["error", "double"],
    },
  },
];
