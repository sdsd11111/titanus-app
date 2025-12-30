import type { Config } from "tailwindcss";

export default {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                spartan: {
                    yellow: "#FCDD09",
                    black: "#000000",
                    charcoal: "#1A1A1A",
                    gold: "#E5C100",
                },
            },
        },
    },
    plugins: [],
} satisfies Config;
