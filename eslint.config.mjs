import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Disable img element warning - allow using <img> instead of <Image />
      "@next/next/no-img-element": "off",

      // Disable html link warning - allow using <a> instead of <Link />
      "@next/next/no-html-link-for-pages": "off",

      // Disable unused expression warning
      "@typescript-eslint/no-unused-expressions": "off",

      // Disable ARIA attribute linting - allow dynamic ARIA values
      "jsx-a11y/aria-props": "off",

      // Disable inline style warning - allow inline styles when needed
      "react/no-danger-with-children": "off",
    },
  },
];

export default eslintConfig;
