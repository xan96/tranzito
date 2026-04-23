export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/fonts'],

  fonts: {
    defaults: {
      weights: [400, 500, 600, 700],
    },
    families: [
      { name: 'Inter', provider: 'bunny' },
    ],
  },

  
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
    // Defaults read raw env vars (DATABASE_URL etc.) so local dev works
    // without NUXT_* prefix. In production NUXT_* env vars override these
    // at runtime as usual (e.g. NUXT_DATABASE_URL).
    jwtSecret: process.env.JWT_SECRET || '',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    databaseUrl: process.env.DATABASE_URL || '',
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: Number(process.env.SMTP_PORT) || 587,
    smtpUser: process.env.SMTP_USER || '',
    smtpPassword: process.env.SMTP_PASSWORD || '',
    // Unisender Go HTTP API — используется вместо SMTP, когда провайдер
    // блокирует исходящие SMTP-порты (стандартная ситуация на VPS).
    unisenderApiKey: process.env.UNISENDER_API_KEY || '',
    mailFrom: process.env.MAIL_FROM || '',
    adminEmail: process.env.ADMIN_EMAIL || '',
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: Number(process.env.MAX_FILE_SIZE) || 10485760,
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
  },

  components: [
    {
      path: './components/ui',
      prefix: 'T',
      pathPrefix: false,
    },
    {
      path: './components/app',
      prefix: 'App',
      pathPrefix: false,
    },
  ],
})
