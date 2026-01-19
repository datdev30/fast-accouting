/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            // Typography - Modern Professional
            fontFamily: {
                heading: ['Poppins', 'system-ui', 'sans-serif'],
                body: ['Open Sans', 'system-ui', 'sans-serif'],
                sans: ['Open Sans', 'system-ui', 'sans-serif'],
            },
            // Color System - Fintech/SaaS
            colors: {
                primary: {
                    DEFAULT: '#2563EB',
                    hover: '#1D4ED8',
                    light: '#3B82F6',
                },
                cta: {
                    DEFAULT: '#F97316',
                    hover: '#EA580C',
                },
            },
            // Spacing Scale (4px base unit)
            spacing: {
                '18': '4.5rem', // 72px
                '22': '5.5rem', // 88px
            },
            // Border Radius Scale
            borderRadius: {
                'xl': '1rem',      // 16px
                '2xl': '1.5rem',   // 24px
                '3xl': '2rem',      // 32px
            },
            // Shadow Scale
            boxShadow: {
                'colored-blue': '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
                'colored-red': '0 10px 15px -3px rgba(239, 68, 68, 0.3)',
                'colored-green': '0 10px 15px -3px rgba(16, 185, 129, 0.3)',
            },
            // Animation Durations
            transitionDuration: {
                'fast': '150ms',
                'normal': '200ms',
                'slow': '300ms',
            },
            // Z-Index Scale
            zIndex: {
                'dropdown': '10',
                'sticky': '20',
                'fixed': '30',
                'modal': '50',
                'toast': '100',
            },
        },
    },
    plugins: [],
}
