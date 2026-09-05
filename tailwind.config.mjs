/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				// Superficies claras con tinte azulado frío
				paper: {
					50: '#FBFCFE',
					100: '#F5F7FA',
					200: '#EAEDF3',
					300: '#DAE0EA',
					400: '#C2CBDA',
				},
				// Neutros oscuros con tinte tinta (azul profundo)
				ink: {
					50: '#F3F5F9',
					100: '#E2E6EF',
					200: '#C4CCDC',
					300: '#9FABC2',
					400: '#7B88A3',
					500: '#5E6C88',
					600: '#47536E',
					700: '#333D55',
					800: '#1F2739',
					900: '#141A28',
					950: '#0C101B',
				},
				// Acento azul enterprise (ecosistema NetSuite/Oracle)
				accent: {
					50: '#EDF2FD',
					100: '#DBE6FA',
					200: '#B7CCF3',
					300: '#8AABE9',
					400: '#5C86DC',
					500: '#3D66CB',
					600: '#2B53B0',
					700: '#254490',
					800: '#213A78',
					900: '#1F3364',
					950: '#162244',
				},
			},
			fontFamily: {
				sans: ['"Onest Variable"', 'system-ui', 'sans-serif'],
				display: ['"Space Grotesk Variable"', '"Onest Variable"', 'system-ui', 'sans-serif'],
				mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
			},
		},
	},
	plugins: [require('@tailwindcss/typography')],
}
