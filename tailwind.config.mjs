import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        serif: ["Lora", ...defaultTheme.fontFamily.serif],
        mono: ["JetBrains Mono", ...defaultTheme.fontFamily.mono],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '70ch',
            lineHeight: '1.8',
            fontSize: '1.125rem',
            'p, li': {
              marginTop: '1.25em',
              marginBottom: '1.25em',
            },
            'h2, h3, h4': {
              marginTop: '2em',
              marginBottom: '0.75em',
            },
            code: {
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.875em',
              fontWeight: '400',
              backgroundColor: 'var(--tw-prose-code-bg)',
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
