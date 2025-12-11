export default defineNuxtConfig({
  // 1. Mode Kompatibilitas Nuxt 4
  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  runtimeConfig: {
    // Private keys (Hanya di server)
    resendApiKey: process.env.RESEND_API_KEY,
    resendFrom: process.env.RESEND_FROM,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET, // Wajib ada untuk generate signature

    // Public keys (Bisa diakses di client/browser)
    public: {
      apiBase: '/api',
      // Tambahkan dua konfigurasi ini agar frontend bisa upload langsung
      cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
      cloudinaryApiKey: process.env.CLOUDINARY_API_KEY
    }
  },

  // Optimasi Memori: Matikan sourcemap di server & client
  sourcemap: {
    server: false,
    client: false
  },

  // Optimasi Memori: Fitur eksperimental
  experimental: {
    payloadExtraction: false
  },

  // 2. Modul
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
    '@nuxtjs/i18n'
  ],

  // 3. Konfigurasi i18n
  i18n: {
    strategy: 'no_prefix', 
    defaultLocale: 'id',
    lazy: false,
    langDir: 'locales',
    locales: [
      { code: 'id', name: 'Indonesia', file: 'id.json', iso: 'id-ID' },
      { code: 'en', name: 'English', file: 'en.json', iso: 'en-US' }
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
      alwaysRedirect: false,
      fallbackLocale: 'id'
    }
  },

  // 4. Konfigurasi Color Mode
  colorMode: {
    classSuffix: ''
  },

  // 5. Build
  build: {
    transpile: ['chart.js']
  },
  
  // 6. TypeScript: Matikan type checking saat runtime untuk hemat memori
  typescript: {
    shim: false,
    typeCheck: false
  },

  // 7. Konfigurasi Vite & Optimasi Build
  vite: {
    build: {
      chunkSizeWarningLimit: 1000, // Naikkan limit warning chunk size
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Pisahkan node_modules besar ke chunk terpisah
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          }
        }
      }
    },
    server: {
      allowedHosts: [
        'adf2c3843988.ngrok-free.app',
        'localhost',
        '127.0.0.1'
      ]
    }
  }
})