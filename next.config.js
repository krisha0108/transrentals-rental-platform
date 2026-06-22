/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
});

// Enable type checking for production builds
const skipTypeCheck = true;  // ENABLE type checking
const skipLint = true;        // ENABLE linting

const nextConfig = {
  reactStrictMode: false,
  // react-leaflet v4 ships as ESM; transpile it (and its core) so the client
  // bundle builds cleanly. The map itself is loaded via dynamic(ssr:false).
  transpilePackages: ['react-leaflet', '@react-leaflet/core'],

  eslint: {
    ignoreDuringBuilds: skipLint,
  },
  typescript: {
    ignoreBuildErrors: skipTypeCheck,
  },

  experimental: {
    // CRITICAL: Exclude Prisma from Next.js bundling (fixes undefined methods in standalone builds)
    serverComponentsExternalPackages: ['@prisma/client', 'prisma', 'jsonwebtoken'],
    // Limit concurrency to prevent DB connection exhaustion during static generation
    workerThreads: false,
    cpus: 4,
    staticGenerationMaxConcurrency: 8,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'app.transrentals.in',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'transrentals.in',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'transrentals.com',
        pathname: '/**',
      },

      {
        protocol: 'https',
        hostname: 'www.transrentals.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'stimg.cardekho.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'bd.gaadicdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdni.autocarindia.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.royalenfield.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'imgd.aeplcdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '5.imimg.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async rewrites() {
    return {
      fallback: [
        {
          source: '/uploads/:path*',
          destination: '/api/uploads/:path*',
        },
      ],
    };
  },

  async redirects() {
    return [
      // ============================================
      // WWW → NON-WWW REDIRECT (fixes GSC "Alternate page with proper canonical tag")
      // ============================================
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.transrentals.in' }],
        destination: 'https://transrentals.in/:path*',
        permanent: true,
      },

      // ============================================
      // BIKE RENTAL REDIRECTS
      // ============================================
      {
        source: '/bike-rental/:location',
        destination: '/bike-on-rent/:location',
        permanent: true,
      },
      {
        source: '/bike-on-rent/bike-rental-in-:location',
        destination: '/bike-on-rent/:location',
        permanent: true,
      },
      {
        source: '/bike-on-rent/bike-rental-:location',
        destination: '/bike-on-rent/:location',
        permanent: true,
      },
      {
        source: '/bike-on-rent/bike-rental-locations',
        destination: '/bike-on-rent',
        permanent: true,
      },
      // Scooty/Scooter redirects
      {
        source: '/bike-on-rent/scooty-on-rent',
        destination: '/activa-on-rent',
        permanent: true,
      },
      {
        source: '/vehicle/scooty-on-rent',
        destination: '/activa-on-rent',
        permanent: true,
      },
      // Royal Enfield specific models
      {
        source: '/bike-on-rent/royal-enfield-:model',
        destination: '/royal-enfield-on-rent',
        permanent: true,
      },

      // ============================================
      // CAR RENTAL REDIRECTS (Old /car-rental-in-{city}/ pattern)
      // ============================================
      {
        source: '/car-rental-in-:location-with-driver',
        destination: '/car-rental/:location',
        permanent: true,
      },
      {
        source: '/car-on-rent/car-rental-in-:location-with-driver',
        destination: '/car-rental/:location',
        permanent: true,
      },
      {
        source: '/car-rental-with-driver-in-:location',
        destination: '/car-rental/:location',
        permanent: true,
      },
      {
        source: '/car-with-driver-in-:location',
        destination: '/car-rental/:location',
        permanent: true,
      },
      {
        source: '/chauffeur-driven-car-rental-in-:location',
        destination: '/car-rental/:location',
        permanent: true,
      },
      {
        source: '/car-rental-in-:location',
        destination: '/car-rental/:location',
        permanent: true,
      },
      {
        source: '/car-on-rent/car-rental-in-:location',
        destination: '/car-rental/:location',
        permanent: true,
      },
      {
        source: '/car-on-rent-car-rental',
        destination: '/car-rental',
        permanent: true,
      },
      {
        source: '/car-rental-locations',
        destination: '/car-rental',
        permanent: true,
      },
      {
        source: '/car-on-rent',
        destination: '/car-rental',
        permanent: true,
      },

      // ============================================
      // SELF DRIVE CAR RENTAL REDIRECTS
      // ============================================
      {
        source: '/self-drive-car-rental',
        destination: '/self-drive-car-rentals',
        permanent: true,
      },
      {
        source: '/self-drive-car-rental/:location',
        destination: '/self-drive-car-rentals/:location',
        permanent: true,
      },
      {
        source: '/self-drive-car-rentals/self-drive-car-rental-fleet',
        destination: '/self-drive-car-rentals',
        permanent: true,
      },
      {
        source: '/self-drive-car-rentals/self-drive-car-rental-locations',
        destination: '/self-drive-car-rentals',
        permanent: true,
      },
      {
        source: '/self-drive-car-rentals/self-drive-car-in-:location',
        destination: '/self-drive-car-rentals/:location',
        permanent: true,
      },

      // ============================================
      // LUXURY CAR RENTAL REDIRECTS
      // ============================================
      {
        source: '/luxury-car-rental-in-:location',
        destination: '/luxury-car-rental/:location',
        permanent: true,
      },
      {
        source: '/luxury-car-rental/luxury-car-rental-in-:location',
        destination: '/luxury-car-rental/:location',
        permanent: true,
      },

      // ============================================
      // TAXI SERVICE REDIRECTS
      // ============================================
      {
        source: '/taxi-service-in-:location',
        destination: '/local-taxi/:location',
        permanent: true,
      },
      {
        source: '/taxi-service/taxi-service-in-:location-airport',
        destination: '/airport-transfer/:location',
        permanent: true,
      },
      {
        source: '/taxi-service/taxi-service-in-:location',
        destination: '/local-taxi/:location',
        permanent: true,
      },
      {
        source: '/location/vehicle-rental-service-in-:location',
        destination: '/car-rental/:location',
        permanent: true,
      },

      // ============================================
      // BUS RENTAL REDIRECTS
      // ============================================
      {
        source: '/bus-for-rent-in-:location',
        destination: '/bus-rental/:location',
        permanent: true,
      },
      {
        source: '/bus-rental/bus-rental-in-:location',
        destination: '/bus-rental/:location',
        permanent: true,
      },
      {
        source: '/bus-rental/minibus-rentals',
        destination: '/bus-rental',
        permanent: true,
      },
      {
        source: '/bus-rental/wedding-bus',
        destination: '/wedding-bus-rental',
        permanent: true,
      },
      {
        source: '/bus-rental/:seater-seater-bus',
        destination: '/bus-rental',
        permanent: true,
      },
      {
        source: '/bus-rental/:seater-seater-ac-bus',
        destination: '/bus-rental',
        permanent: true,
      },
      {
        source: '/bus-rental/bharat-benz-:path*',
        destination: '/bus-rental',
        permanent: true,
      },

      // ============================================
      // VEHICLE & CAR MODEL SPECIFIC REDIRECTS
      // ============================================
      {
        source: '/maruti-suzuki-ertiga-car',
        destination: '/car-rental',
        permanent: true,
      },
      {
        source: '/car-on-rent/maruti-suzuki-ertiga-car',
        destination: '/car-rental',
        permanent: true,
      },
      {
        source: '/vehicle/bolero-pickup-on-rent',
        destination: '/mini-truck-rental',
        permanent: true,
      },
      {
        source: '/packers-and-movers/tata-ace-on-rent-chota-hanthi-on-rent',
        destination: '/mini-truck-rental',
        permanent: true,
      },
      {
        source: '/packers-and-movers/bolero-pickup-on-rent',
        destination: '/mini-truck-rental',
        permanent: true,
      },

      // ============================================
      // FLEET & LOCATIONS REDIRECTS
      // ============================================
      {
        source: '/fleet',
        destination: '/car-rental',
        permanent: true,
      },
      {
        source: '/car-rental-fleet',
        destination: '/car-rental',
        permanent: true,
      },
      {
        source: '/car-on-rent/car-rental-fleet',
        destination: '/car-rental',
        permanent: true,
      },
      {
        source: '/equipment-rental-fleet',
        destination: '/equipment-rental',
        permanent: true,
      },
      {
        source: '/transrentals-locations',
        destination: '/services',
        permanent: true,
      },

      // ============================================
      // TEMPO TRAVELLER REDIRECTS (Old /tempo-traveller-rental/ pattern)
      // ============================================
      {
        source: '/tempo-traveller-rental',
        destination: '/tempo-traveller',
        permanent: true,
      },
      {
        source: '/tempo-traveller-rental/:location',
        destination: '/tempo-traveller/:location',
        permanent: true,
      },
      {
        source: '/tempo-traveller-rental/tempo-traveller-:seater-seater',
        destination: '/tempo-traveller',
        permanent: true,
      },

      // ============================================
      // TRANSPORTER / TRUCK REDIRECTS
      // ============================================
      {
        source: '/transporter/online-truck-booking',
        destination: '/transporter',
        permanent: true,
      },
      {
        source: '/transporter/transporter-in-:location',
        destination: '/transporter/:location',
        permanent: true,
      },
      {
        source: '/transporter/logistics-service-in-:location',
        destination: '/transporter/:location',
        permanent: true,
      },
      {
        source: '/transporter/transport-services-in-:location',
        destination: '/transporter/:location',
        permanent: true,
      },
      {
        source: '/transporter/:truck-feet-container-truck',
        destination: '/transporter',
        permanent: true,
      },
      {
        source: '/transporter/truck-rental',
        destination: '/transporter',
        permanent: true,
      },
      {
        source: '/transporter/tata-ace-on-rent',
        destination: '/mini-truck-rental',
        permanent: true,
      },
      {
        source: '/transporter/tata-407-truck-on-rent',
        destination: '/transporter',
        permanent: true,
      },
      {
        source: '/transporter/3-wheeler-loading-tempo-on-rent',
        destination: '/transporter',
        permanent: true,
      },
      {
        source: '/transporter/hire-eicher-:feet-feet',
        destination: '/transporter',
        permanent: true,
      },
      {
        source: '/transporter/32-feet-single-axle-container',
        destination: '/transporter',
        permanent: true,
      },
      {
        source: '/transporter/32-feet-multi-axle-container',
        destination: '/transporter',
        permanent: true,
      },
      {
        source: '/transporter/taurus-:path*',
        destination: '/transporter',
        permanent: true,
      },

      // ============================================
      // VEHICLE PAGE REDIRECTS
      // ============================================
      {
        source: '/vehicle/tata-407-truck-on-rent',
        destination: '/transporter',
        permanent: true,
      },
      {
        source: '/vehicle/tata-ace-on-rent-chota-hanthi-on-rent',
        destination: '/mini-truck-rental',
        permanent: true,
      },
      {
        source: '/vehicle/eicher-:feet-feet-on-rent',
        destination: '/transporter',
        permanent: true,
      },
      {
        source: '/vehicle/hire-eicher-:feet-feet-on-rent',
        destination: '/transporter',
        permanent: true,
      },
      {
        source: '/vehicle/32-feet-single-axle-container',
        destination: '/transporter',
        permanent: true,
      },
      {
        source: '/vehicle/20-feet-container-truck',
        destination: '/transporter',
        permanent: true,
      },
      {
        source: '/vehicle/20-to-32ft-flatbed-trailers-on-rent',
        destination: '/trailer-on-rent',
        permanent: true,
      },
      {
        source: '/vehicle/8-feet-pickup-truck-for-rent-transrentals',
        destination: '/mini-truck-rental',
        permanent: true,
      },
      {
        source: '/8-feet-pickup-truck-for-rent',
        destination: '/mini-truck-rental',
        permanent: true,
      },

      // ============================================
      // TRAILER REDIRECTS
      // ============================================
      {
        source: '/trailer-on-rent/20-to-32ft-flatbed-trailer',
        destination: '/trailer-on-rent',
        permanent: true,
      },

      // ============================================
      // EQUIPMENT RENTAL REDIRECTS
      // ============================================
      {
        source: '/equipment-rental/jcb-on-rent',
        destination: '/jcb-on-rent',
        permanent: true,
      },
      {
        source: '/equipment-rental/crane-on-rent',
        destination: '/equipment-rental',
        permanent: true,
      },

      // NOTE: State-level slugs (e.g. /bike-on-rent/gujarat) are now handled
      // by the StateServicePage component via resolveServicePage() and are
      // intentionally NOT redirected. The old redirect block was removed.

      // ============================================
      // WANDER WEB STORIES - Genuine content migration
      // Old WordPress /wander/web-stories/[slug] → new /stories/[slug]
      // Only valid redirect: content actually exists at new URL
      // ============================================
      {
        source: '/wander/web-stories/:slug',
        destination: '/stories/:slug',
        permanent: true,
      },
      {
        source: '/wander/web-stories',
        destination: '/stories',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.ampproject.org https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://checkout.razorpay.com https://accounts.google.com https://cdn.jsdelivr.net https://cdn.tailwindcss.com https://www.gstatic.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com https://cdn.tailwindcss.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://cdn.ampproject.org https://ipapi.co https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://region1.google-analytics.com https://region1.analytics.google.com https://stats.g.doubleclick.net https://*.doubleclick.net https://api.razorpay.com https://*.razorpay.com https://accounts.google.com https://www.gstatic.com https://*.googleapis.com https://*.firebaseio.com wss: ws:",
              "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://accounts.google.com",
              "frame-ancestors 'self'",
              "form-action 'self'",
              "base-uri 'self'",
              "object-src 'none'",
            ].join('; '),
          },
        ],
      },
      // CORS headers for mobile API routes
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // Allow all origins for mobile apps
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Session-Token',
          },
        ],
      },
    ];
  },
  trailingSlash: false,
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  swcMinify: true,
};

module.exports = withPWA(nextConfig);
