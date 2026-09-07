import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const SERVICE_CONFIG: Record<string, { name: string; tagline: string; color: string; bg: string }> = {
  'car-rental':        { name: 'Car Rental',           tagline: 'Self-drive & Chauffeur-driven',       color: '#3b82f6', bg: '#1e3a5f' },
  'bike-on-rent':      { name: 'Bike Rental',          tagline: 'Explore on Two Wheels',               color: '#22c55e', bg: '#14532d' },
  'bus-rental':        { name: 'Bus Rental',           tagline: 'Group Travel Made Easy',              color: '#a855f7', bg: '#3b0764' },
  'mini-truck-rental': { name: 'Mini Truck Rental',    tagline: 'Tata Ace & Mahindra Pickup',          color: '#f59e0b', bg: '#451a03' },
  'packers-and-movers':{ name: 'Packers & Movers',     tagline: 'Safe, Insured & Certified Moving',    color: '#ec4899', bg: '#500724' },
  'equipment-rental':  { name: 'Equipment Rental',     tagline: 'Construction & Event Equipment',      color: '#f97316', bg: '#431407' },
  'luxury-car-rental': { name: 'Luxury Car Rental',    tagline: 'BMW · Mercedes · Audi · Ferrari',     color: '#eab308', bg: '#1a1200' },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get('service');
  const location = searchParams.get('location') ?? 'India';

  // No `service` param — this is the site-wide default (homepage, or any page
  // that doesn't set its own og:image). Doesn't fit the "<Service> in
  // <Location>" template the rest of this route uses, so it gets its own
  // marketplace-branded layout instead of forcing it into SERVICE_CONFIG.
  if (!service) {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            display: 'flex',
            flexDirection: 'column',
            background: '#0a0a0a',
            padding: '56px 64px',
            fontFamily: '"Inter", sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -140,
              right: -100,
              width: 560,
              height: 560,
              borderRadius: '50%',
              background: '#14532d',
              opacity: 0.7,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -180,
              left: -140,
              width: 500,
              height: 500,
              borderRadius: '50%',
              background: '#166534',
              opacity: 0.45,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 6,
              background: '#22c55e',
            }}
          />

          {/* Brand header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, zIndex: 1 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ color: '#000', fontSize: 22, fontWeight: 900 }}>T</div>
            </div>
            <div style={{ color: '#f1f5f9', fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>
              TransRentals
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ color: '#64748b', fontSize: 18 }}>transrentals.in</div>
          </div>

          {/* Main content */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              zIndex: 1,
              marginTop: 20,
            }}
          >
            <div
              style={{
                color: '#22c55e',
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: 3,
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              India&rsquo;s Largest Vehicle Rental Marketplace
            </div>
            <div style={{ color: '#f8fafc', fontSize: 64, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2 }}>
              Bikes · Cars · Buses
            </div>
            <div style={{ color: '#f8fafc', fontSize: 64, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2 }}>
              Trucks · Equipment
            </div>
          </div>

          {/* Bottom trust bar */}
          <div
            style={{
              display: 'flex',
              gap: 36,
              borderTop: '1px solid #1e293b',
              paddingTop: 24,
              zIndex: 1,
            }}
          >
            {['10,000+ Verified Vendors', '150+ Cities', '2,00,000+ Bookings', '4.8/5 Rated'].map((t) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                <div style={{ color: '#94a3b8', fontSize: 16 }}>{t}</div>
              </div>
            ))}
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const cfg = SERVICE_CONFIG[service] ?? SERVICE_CONFIG['car-rental'];

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          background: '#0a0a0a',
          padding: '56px 64px',
          fontFamily: '"Inter", sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background gradient blob */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -80,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: cfg.bg,
            opacity: 0.7,
          }}
        />
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: cfg.color,
          }}
        />

        {/* Brand header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, zIndex: 1 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: cfg.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ color: '#000', fontSize: 22, fontWeight: 900 }}>T</div>
          </div>
          <div style={{ color: '#f1f5f9', fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>
            TransRentals
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ color: '#64748b', fontSize: 18 }}>transrentals.in</div>
        </div>

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            zIndex: 1,
            marginTop: 20,
          }}
        >
          <div
            style={{
              color: cfg.color,
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: 3,
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            {cfg.tagline}
          </div>
          <div
            style={{
              color: '#f8fafc',
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: -2,
              marginBottom: 8,
            }}
          >
            {cfg.name}
          </div>
          <div
            style={{
              color: '#94a3b8',
              fontSize: 52,
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: -1,
            }}
          >
            in {location}
          </div>
        </div>

        {/* Bottom trust bar */}
        <div
          style={{
            display: 'flex',
            gap: 36,
            borderTop: '1px solid #1e293b',
            paddingTop: 24,
            zIndex: 1,
          }}
        >
          {['Verified Vendors', 'Instant Booking', '24/7 Support', 'Best Price Guarantee'].map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: cfg.color,
                }}
              />
              <div style={{ color: '#94a3b8', fontSize: 16 }}>{t}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
