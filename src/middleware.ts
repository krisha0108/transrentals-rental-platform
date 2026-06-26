import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { addSecurityHeaders } from '@/lib/security/headers';

// Fleet slugs that no longer exist in DB — return 410 Gone so Google de-indexes fast
const DEAD_FLEET_SLUGS = new Set([
  '14-ton-medium-truck', '20-seater-mini-bus', '26-seater-tourist-mini-bus',
  '32-ton-heavy-truck', '35-seater-tourist-coach', '40-seater-tourist-coach',
  '49-seater-standard-tourist-coach', '7-ton-mini-truck', 'ac-sleeper-coach',
  'aerial-platform-truck-truck-mounted-bucket-lift-20-m', 'air-compressor-diesel-powered-100-cfm',
  'ashok-leyland-2820-tipper', 'asphalt-mixing-plant-60-tph-capacity', 'audi-a6',
  'backhoe-loader-jcb-3dx-plus', 'bajaj-avenger-220-cruise', 'bajaj-pulsar-150',
  'bajaj-pulsar-rs200', 'bharatbenz-1617r', 'bharatbenz-712r',
  'bharatbenz-ac-tourist-luxury-coach', 'bitumen-sprayer-truck-mounted-asphalt-distributor-8-kl',
  'bmw-5-series', 'boom-lift-telescopic-aerial-work-platform-20-m',
  'bulldozer-crawler-type-180-hp', 'cold-milling-machine-asphalt-road-planer-500-mm',
  'concrete-batching-plant-30-m-hr-capacity', 'concrete-mixer-7-m-drum-capacity',
  'concrete-pump-truck-truck-mounted-boom-pump-36-m', 'crawler-crane-heavy-lift-50-ton-capacity',
  'double-decker-sleeper-coach', 'drilling-rig-borewell-foundation-driller-150-hp',
  'dump-truck-16-ton-hydraulic-tipper', 'forklift-3-ton-industrial-lift', 'hero-hf-deluxe',
  'hero-splendor-plus', 'honda-cb350rs', 'honda-cbr650r', 'honda-city',
  'hydra-crane-truck-mounted-25-ton-capacity',
  'hydro-excavator-truck-mounted-hydro-vacuum-excavation-unit', 'hyundai-i20', 'jaguar-xf',
  'kawasaki-ninja-400', 'ktm-duke-390', 'ktm-rc-200',
  'line-marking-machine-truck-mounted-road-paint-unit', 'mahindra-jeeto', 'mahindra-xuv500',
  'maruti-ciaz', 'mechanical-broomer-truck-mounted-road-sweeper', 'mercedes-benz-e-class',
  'mercedes-benz-multi-axle-luxury-coach', 'mercedes-e-class', 'mercedes-maybach-s-class',
  'mini-school-bus', 'mobile-crane-truck-mounted-35-ton-capacity',
  'motor-grader-road-construction-grade-170-hp', 'multi-axle-luxury-sleeper-coach',
  'needs-school-bus', 'paver-finisher-asphalt-road-laying-100-hp',
  'pick-carry-crane-industrial-lifting-crane-15-ton', 'pneumatic-roller-rubber-tyre-compactor-85-hp',
  'road-milling-machine-asphalt-cutter-200-hp', 'road-roller-single-drum-vibratory-110-hp',
  'road-sweeper-machine-truck-mounted-vacuum-sweeper', 'rock-breaker-hydraulic-excavator-attachment',
  'royal-enfield-classic-350', 'royal-enfield-himalayan', 'royal-enfield-meteor-350',
  'scissor-lift-vertical-aerial-work-platform-12-m', 'seater-sleeper-combination-coach',
  'skid-steer-loader-compact-site-loader-75-hp', 'sleeper-coach',
  'slipform-paver-concrete-road-paving-machine-8-m', 'sml-isuzu-sartaj-container-17ft',
  'sml-isuzu-sartaj-gs-5252', 'standard-yellow-school-bus', 'suzuki-access-125',
  'suzuki-gixxer-250', 'tandem-roller-double-drum-asphalt-compactor-90-hp', 'tata-1109',
  'tata-1512', 'tata-709', 'tata-809', 'tata-altroz', 'tata-intra-v10', 'tata-signa-2518',
  'tower-crane-high-rise-construction-10-ton-capacity', 'transit-mixer-6-m-drum-capacity',
  'trenching-machine-cable-pipeline-trencher-90-hp',
  'truck-mounted-crane-hydraulic-lifting-crane-25-ton', 'tvs-apache-rr-310', 'tvs-apache-rr310',
  'tvs-apache-rtr-200-4v', 'tvs-jupiter', 'vacuum-loader-truck-mounted-industrial-suction-unit-10-kl',
  'vibratory-compactor-single-drum-95-hp', 'volvo-9400', 'volvo-fm-420-mav',
  'yamaha-aerox-155', 'yamaha-yzf-r3',
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Return 410 Gone for /reviews/* — route never existed, tell Google to de-index
  if (pathname.startsWith('/reviews/')) {
    return new NextResponse(null, { status: 410 });
  }

  // Return 410 Gone for dead fleet vehicle slugs
  if (pathname.startsWith('/fleet/')) {
    const slug = pathname.split('/')[2];
    if (slug && DEAD_FLEET_SLUGS.has(slug)) {
      return new NextResponse(null, { status: 410 });
    }
  }

  // 410 Gone for any URL with /undefined/ — JS bug created these, never valid pages
  if (pathname.includes('/undefined/')) {
    return new NextResponse(null, { status: 410 });
  }

  // 301 redirects for dead /wander/* sub-routes
  if (pathname.startsWith('/wander/web-stories/')) {
    return NextResponse.redirect(new URL('/stories', request.url), 301);
  }
  if (
    pathname.startsWith('/wander/author/') ||
    pathname.startsWith('/wander/things-to-do/') ||
    pathname.startsWith('/wander/tour/') ||
    pathname.startsWith('/wander/self-drive/')
  ) {
    return NextResponse.redirect(new URL('/wander', request.url), 301);
  }

  // 301 redirect for /book-taxi/* — no route exists, send to chauffeur
  if (pathname.startsWith('/book-taxi/')) {
    return NextResponse.redirect(new URL('/chauffeur', request.url), 301);
  }

  // 301 redirect for /ahmdabad typo → correct /ahmedabad spelling
  if (pathname.endsWith('/ahmdabad')) {
    return NextResponse.redirect(new URL(pathname.replace('/ahmdabad', '/ahmedabad'), request.url), 301);
  }

  // 410 for URLs with literal & in path — invalid URLs Google crawled
  if (pathname.includes('&')) {
    return new NextResponse(null, { status: 410 });
  }

  // Handle CORS preflight requests for API routes
  if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Handle admin route protection
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Check if token exists and is an admin
    if (!token || token.userType !== 'admin') {
      const loginUrl = new URL('/admin/login', request.url);
      const redirectResponse = NextResponse.redirect(loginUrl);
      return addSecurityHeaders(redirectResponse);
    }
  }

  // Handle vendor dashboard protection (exclude auth pages, API and public share links)
  if (pathname.startsWith('/vendor/') &&
      !pathname.startsWith('/vendor/login') &&
      !pathname.startsWith('/vendor/register') &&
      !pathname.startsWith('/vendor/forgot-password') &&
      !pathname.startsWith('/vendor/p2p/share/') &&
      pathname !== '/vendor') {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Check if token exists and is a vendor
    if (!token || token.userType !== 'vendor') {
      const loginUrl = new URL('/vendor/login', request.url);
      const redirectResponse = NextResponse.redirect(loginUrl);
      return addSecurityHeaders(redirectResponse);
    }
  }

  // Handle travel-agent dashboard protection (exclude auth pages, public lead-capture, share links)
  if (pathname.startsWith('/travel-agent/') &&
      !pathname.startsWith('/travel-agent/login') &&
      !pathname.startsWith('/travel-agent/register') &&
      !pathname.startsWith('/travel-agent/forgot-password') &&
      !pathname.startsWith('/travel-agent/lead/') &&
      !pathname.startsWith('/travel-agent/booking/share/') &&
      pathname !== '/travel-agent') {
    // Travel-agent provider lives in the default authOptions, so the cookie
    // is the default NextAuth session cookie — no custom cookieName needed.
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.userType !== 'travel_agent') {
      const loginUrl = new URL('/travel-agent/login', request.url);
      const redirectResponse = NextResponse.redirect(loginUrl);
      return addSecurityHeaders(redirectResponse);
    }
  }

  // NOTE: Dynamic redirects via Prisma removed - use next.config.js redirects instead
  // Prisma cannot run in Edge Runtime (middleware always runs on edge)
  // Static redirects in next.config.js handle all redirect cases

  // Add security headers to all responses
  const response = NextResponse.next();

  // AMP story routes must be frameable by Google's AMP viewer
  // X-Frame-Options: SAMEORIGIN and frame-ancestors CSP would block Google Search
  const isAmpStoryRoute = /^\/stories\/[^/]+\/amp/.test(pathname);
  if (isAmpStoryRoute) {
    return response; // No security headers for AMP story pages
  }

  // Add CORS headers to all API responses (for mobile app support)
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
