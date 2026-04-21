/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#1A73E8',
                    hover: '#1557B0',
                },
                secondary: '#3949AB',
                accent: '#00C853',
                background: '#F5F8FF',
                textMain: '#1A1A1A',
                textMuted: '#6B7280',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            borderRadius: {
                'sms': '10px',
            },
            boxShadow: {
                'soft': '0 4px 12px rgba(0, 0, 0, 0.05)',
                'hover': '0 8px 24px rgba(0, 0, 0, 0.1)',
                'btn': '0 4px 10px rgba(26, 115, 232, 0.3)',
                'btn-hover': '0 6px 15px rgba(26, 115, 232, 0.4)',
                'btn-accent': '0 4px 10px rgba(0, 200, 83, 0.3)',
                'btn-accent-hover': '0 6px 15px rgba(0, 200, 83, 0.4)',
            },
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, #1A73E8, #3949AB)',
                'gradient-accent': 'linear-gradient(135deg, #00E676, #00C853)',
            }
        },
    },
    plugins: [],
}
