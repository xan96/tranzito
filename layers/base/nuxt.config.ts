export default defineNuxtConfig({
  modules: ['@nuxt/ui'],

  
  ui: {
    global: true,
  },

  tailwindcss: {
    config: {
      theme: {
        extend: {
          colors: {
            // T-Bank brand colors
            tbank: {
              yellow: {
                DEFAULT: '#ffdd2d',
                hover: '#ffcd33',
                pressed: '#fab619',
              },
              blue: {
                DEFAULT: '#428bf9',
                dark: '#126df7',
              },
              gray: {
                border: 'rgba(0, 16, 36, 0.12)',
                bg: 'rgba(36, 74, 127, 0.06)',
              },
            },
            // Override primary with T-Bank yellow
            primary: {
              50: '#fffef5',
              100: '#fffde6',
              200: '#fff8c2',
              300: '#ffee85',
              400: '#ffdd2d', // T-Bank main yellow
              500: '#ffcd33', // hover
              600: '#fab619', // pressed
              700: '#d49a00',
              800: '#a67800',
              900: '#7a5800',
              950: '#4d3700',
            },
          },
          fontFamily: {
            sans: ['Inter', 'Arial', 'system-ui', 'sans-serif'],
          },
          borderRadius: {
            'tbank-sm': '4px',
            'tbank': '8px',
            'tbank-lg': '12px',
            'tbank-xl': '16px',
          },
        },
      },
    },
  },

  runtimeConfig: {
    // Defaults are used at build time. At runtime Nuxt overrides these
    // with NUXT_* prefixed env vars (e.g. NUXT_DATABASE_URL).
    jwtSecret: '',
    jwtExpiresIn: '7d',
    databaseUrl: '',
    mailProvider: 'console',
    unisenderApiKey: '',
    mailFrom: 'noreply@tranzitum.ru',
    uploadDir: './uploads',
    maxFileSize: 10485760,
    public: {
      appUrl: 'http://localhost:3000',
    },
  },

  components: [
    {
      path: './components/ui',
      prefix: 'T',
      pathPrefix: false,
    },
  ],
})
