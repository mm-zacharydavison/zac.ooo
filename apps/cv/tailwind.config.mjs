/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}', './node_modules/flowbite/**/*.js'],
	daisyui: {
		themes: [
			{
				lofi: {
					...require("daisyui/src/theming/themes")["lofi"],
					"--rounded-box": "0.25rem",
					"--rounded-btn": "0.2rem",
					"--rounded-badge": "0.25rem"
				},
				black: {
					...require("daisyui/src/theming/themes")["black"],
					"--rounded-box": "0.25rem",
					"--rounded-btn": "0.2rem",
					"--rounded-badge": "0.25rem",
					"secondary": "#e5e5e5"
				}
			}
		],
	},
	theme: {
		extend: {
			fontFamily: {
				'sans': ["DM Sans", "Inter", ...defaultTheme.fontFamily.sans],
			},
		},
	},
	plugins: [require("@tailwindcss/typography"), require("daisyui")],
}
