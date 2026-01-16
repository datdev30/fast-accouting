/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            screens: {
                // Tablet breakpoint: 768px - 1023px (iPad Pro 11" portrait: 834px, landscape: 1194px)
                // Mobile: < 768px
                // Tablet: 768px - 1023px
                // Desktop: >= 1024px
                'tablet': { 'min': '768px', 'max': '1023px' },
            },
        },
    },
    plugins: [],
}
