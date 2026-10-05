/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        alexa: {
          blue: '#00CAFF',
          darkBlue: '#0052FF',
          navy: '#0B132B',
          card: '#1C2541',
          accent: '#5BC0BE',
        },
      },
    },
  },
  plugins: [],
};
