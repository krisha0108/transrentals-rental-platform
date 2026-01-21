# TransRentals Website

A modern, SEO-optimized vehicle rental marketplace website built with Next.js 14, TypeScript, and Tailwind CSS.

## Overview

TransRentals is India's largest vehicle rental marketplace, offering bikes, cars, buses, trucks, equipment, and packers & movers services across 150+ cities. This website serves as the customer-facing platform with dynamic location pages and integrated booking capabilities.

## Tech Stack

- **Framework**: Next.js 14.2.18 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4
- **State Management**: TanStack React Query 5.59
- **HTTP Client**: Axios 1.7
- **UI Components**: Radix UI + Shadcn/ui
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **Backend API**: Laravel 11 (app.transrentals.in/api)

## Project Structure

```
transrentals-web/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── (services)/           # Service pages group
│   │   │   ├── bike-on-rent/
│   │   │   │   ├── [location]/   # Dynamic location pages
│   │   │   │   └── page.tsx
│   │   │   ├── car-rental/
│   │   │   ├── bus-rental/
│   │   │   ├── transporter/
│   │   │   └── equipment-rental/
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Homepage
│   ├── components/
│   │   ├── home/                 # Homepage sections
│   │   ├── layout/               # Header, Footer
│   │   ├── location/             # Location page components
│   │   └── ui/                   # Reusable UI components
│   ├── lib/
│   │   ├── api/                  # API client & endpoints
│   │   └── utils.ts              # Utility functions
│   ├── types/                    # TypeScript definitions
│   └── styles/                   # Global styles
├── public/                       # Static assets
├── database/                     # Laravel migrations
│   └── migrations/               # SEO & content tables
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Key Features

### 1. Dynamic Location Pages
- **400+ Auto-generated Pages**: Each service category has pages for 150+ locations
- **URL Structure**: `transrentals.in/bike-on-rent/[location]`
- **SEO Optimized**: Unique meta titles, descriptions, and schema markup per page
- **Static Site Generation**: Popular locations pre-rendered at build time

### 2. Service Categories
- Bike Rentals (Daily/Monthly/Self-Drive/With Driver)
- Car Rentals (Self-Drive/With Driver)
- Bus Rentals (AC/Non-AC Buses)
- Truck Rentals (7-ton to 32-ton vehicles)
- Equipment Rentals (Construction & events)
- Packers & Movers
- Airport Transfers

### 3. Homepage Components
- Hero section with search widget
- Services grid
- Features showcase
- How it works (4-step process)
- Testimonials carousel
- Popular destinations
- Blog preview
- CTA section

### 4. API Integration
- Connected to existing Laravel backend
- 12+ booking endpoints
- Location and service data fetching
- Authentication with JWT tokens
- Error handling and retry logic

### 5. Database Structure (Laravel)
New migrations for SEO optimization:
- `location_pages` - SEO content for each location
- `fleet_pages` - Individual vehicle model pages
- `blog_posts` - Travel guides and content
- `seo_redirects` - URL redirect management
- `service_slugs` - Search volume tracking

## Getting Started

### Prerequisites

- Node.js 18+ (recommended 20.x)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   cd Trans_main/transrentals-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**

   Create `.env.local`:
   ```env
   # API Configuration
   NEXT_PUBLIC_API_URL=https://app.transrentals.in/api
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Contact Information
   NEXT_PUBLIC_CONTACT_EMAIL=support@transrentals.in
   NEXT_PUBLIC_CONTACT_PHONE=+91-XXXXXXXXXX
   NEXT_PUBLIC_WHATSAPP_NUMBER=+91-XXXXXXXXXX

   # Feature Flags
   NEXT_PUBLIC_ENABLE_BLOG=true
   NEXT_PUBLIC_ENABLE_VENDOR_SIGNUP=true
   ```

4. **Run development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open browser**
   ```
   http://localhost:3000
   ```

### Build for Production

```bash
npm run build
npm start
```

## Development Workflow

### Adding New Location Pages

1. Add location to `generateStaticParams()` in the service page
2. Update location list in `/lib/data/locations.ts`
3. Create SEO content in Laravel database
4. Rebuild site to generate new static pages

### Creating New Service Categories

1. Create new route: `app/(services)/[service-name]/page.tsx`
2. Add dynamic location route: `app/(services)/[service-name]/[location]/page.tsx`
3. Create API endpoints in `lib/api/`
4. Add TypeScript types in `types/index.ts`
5. Update navigation in `components/layout/Header.tsx`

### Adding New Components

```typescript
// components/example/MyComponent.tsx
import { ComponentProps } from '@/types';

export function MyComponent({ title, description }: ComponentProps) {
  return (
    <div className="container-custom py-16">
      <h2 className="text-3xl font-bold">{title}</h2>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
```

## API Endpoints

### Booking APIs
- `POST /customer-bike-booking` - Create bike booking
- `POST /customer-car-booking` - Create car booking
- `POST /customer-bus-booking` - Create bus booking
- `POST /customer-truck-booking` - Create truck booking
- `POST /customer-equipment-booking` - Create equipment booking
- `POST /customer-packers-movers-booking` - Create P&M booking
- `POST /customer-airport-transfer-booking` - Create airport transfer

### Data APIs
- `GET /locations` - Fetch all locations
- `GET /services` - Fetch all services
- `GET /vehicles` - Fetch available vehicles
- `GET /pages/{service}/{location}` - Get location page data

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Laravel API base URL | `https://app.transrentals.in/api` |
| `NEXT_PUBLIC_APP_URL` | Website base URL | `https://transrentals.in` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Support email | `support@transrentals.in` |
| `NEXT_PUBLIC_CONTACT_PHONE` | Contact phone | `+91-XXXXXXXXXX` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics ID | - |
| `NEXT_PUBLIC_ENABLE_BLOG` | Enable blog section | `false` |
| `NEXT_PUBLIC_API_TIMEOUT` | API request timeout | `15000` |

## SEO Strategy

### Meta Tags
- Unique titles and descriptions per page
- Open Graph tags for social sharing
- Twitter Card metadata
- Canonical URLs

### Schema Markup
- Organization schema
- LocalBusiness schema
- BreadcrumbList schema
- Product schema for vehicles

### Sitemaps
- Dynamic sitemap generation
- Service-specific sitemaps
- Location-based sitemaps
- Blog post sitemap

### URL Structure
```
transrentals.in/
├── bike-on-rent/
│   ├── goa
│   ├── manali
│   └── bangalore
├── car-rental/
│   ├── delhi
│   └── mumbai
└── blog/
    └── best-bike-routes-in-goa
```

## Performance Optimization

### Image Optimization
- Next.js Image component with automatic WebP conversion
- Lazy loading for below-the-fold images
- Responsive images with srcset

### Code Splitting
- Automatic route-based splitting
- Dynamic imports for heavy components
- Tree shaking for unused code

### Caching Strategy
- Static page caching (ISR)
- API response caching with React Query
- Browser caching headers
- CDN integration (Vercel Edge Network)

### Lighthouse Scores Target
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. Push to GitHub
   ```bash
   git push origin main
   ```

2. Import to Vercel
   - Visit [vercel.com](https://vercel.com)
   - Import repository
   - Configure environment variables
   - Deploy

3. Configure custom domain
   - Add `transrentals.in` in Vercel dashboard
   - Update DNS records

## Testing

### Run Tests
```bash
npm test
# or
yarn test
```

### Run Linter
```bash
npm run lint
# or
yarn lint
```

### Type Check
```bash
npm run type-check
# or
yarn type-check
```

## Integration with Existing Apps

This website integrates with the existing TransRentals ecosystem:

- **tr-app** (Customer Mobile): Shares same Laravel API
- **tr-vendor-app** (Vendor Mobile): Vendor management
- **transrentals_crm_HOC** (Laravel Backend): Main API server

### Shared Resources
- Authentication system
- Booking endpoints
- Location and service data
- User profiles

## Contributing

1. Create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make changes and commit
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. Push to remote
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create pull request

## Troubleshooting

### Common Issues

**Build fails with module not found**
```bash
rm -rf node_modules .next
npm install
npm run build
```

**Environment variables not loading**
- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Restart dev server after changing `.env.local`

**API requests failing**
- Check `NEXT_PUBLIC_API_URL` is correct
- Verify Laravel API is running
- Check CORS configuration in Laravel

**Images not loading**
- Verify image paths in `public/` directory
- Check `next.config.js` image configuration
- Ensure remote image domains are whitelisted

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Android)

## License

Proprietary - TransRentals Private Limited

## Support

- **Technical Issues**: tech@transrentals.in
- **Business Queries**: support@transrentals.in
- **Phone**: +91-XXXXXXXXXX
- **Website**: https://transrentals.in

## Roadmap

### Phase 1 (Current)
- [x] Homepage with all sections
- [x] Dynamic location pages for bike rentals
- [x] API integration
- [x] SEO optimization
- [ ] Deployment to production

### Phase 2
- [ ] Complete all service category pages
- [ ] Fleet detail pages (individual vehicles)
- [ ] Blog section
- [ ] Vendor signup flow
- [ ] User dashboard

### Phase 3
- [ ] Advanced search and filters
- [ ] Real-time availability
- [ ] Online payment integration
- [ ] Review and rating system
- [ ] Multi-language support

### Phase 4
- [ ] Mobile app deep linking
- [ ] Progressive Web App (PWA)
- [ ] Push notifications
- [ ] Referral program
- [ ] Loyalty rewards

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Maintainer**: TransRentals Development Team
