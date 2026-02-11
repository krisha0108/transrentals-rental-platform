# Conversion Tracking System - Implementation Guide

## Overview
Complete enterprise-level conversion tracking system with funnel analytics, keyword performance, user flow tracking, and booking attribution.

## Database Tables Created ✅
- `conversion_events` - All user actions (15 event types)
- `booking_attribution` - First/last touch attribution
- `user_flow` - Page-to-page navigation
- `keyword_performance` - Keyword metrics & ROI
- `funnel_analytics` - Funnel step analysis

## API Endpoints Created ✅

### 1. Tracking Endpoint
**POST /api/analytics/conversion**
- Track events, flows, keywords, funnels, and attribution

### 2. Analytics Endpoints
- **GET /api/admin/analytics/conversion** - Conversion funnel & performance
- **GET /api/admin/analytics/keywords** - Keyword performance & ROI
- **GET /api/admin/analytics/flow** - User flow & navigation paths
- **GET /api/admin/analytics/attribution** - Booking attribution (first/last touch)

## Usage Examples

### 1. Auto Page Tracking
```tsx
'use client';
import { useConversionTracking } from '@/hooks/useConversionTracking';

export default function MyPage() {
  const tracking = useConversionTracking();
  // ✅ Automatically tracks PAGE_VISIT and user flow

  return <div>...</div>;
}
```

### 2. Track Search
```tsx
const { trackSearch } = useConversionTracking();

// When user searches
trackSearch('bike rental mumbai', {
  city: 'mumbai',
  type: 'bike'
});
```

### 3. Track Quote Request
```tsx
const { trackQuoteRequest } = useConversionTracking();

// When user submits quote form
const handleQuoteSubmit = async (formData) => {
  trackQuoteRequest('bike', {
    pickup: formData.pickup,
    dropoff: formData.dropoff,
    date: formData.date,
  });

  // Submit form...
};
```

### 4. Track Booking Completion
```tsx
const { trackBookingCompleted } = useConversionTracking();

// When booking is confirmed
trackBookingCompleted(
  bookingId,      // e.g., 'BK123456'
  'bike',         // booking type
  2500,           // booking value
  250             // commission (optional)
);
// ✅ Automatically creates attribution record
```

### 5. Track CTA Clicks
```tsx
const { trackCTAClick } = useConversionTracking();

<button onClick={() => {
  trackCTAClick('Book Now', 'Hero Section');
  // Handle click...
}}>
  Book Now
</button>
```

### 6. Track Phone/Email Clicks
```tsx
const { trackPhoneClick, trackEmailClick } = useConversionTracking();

<a
  href="tel:+919876543210"
  onClick={() => trackPhoneClick('+919876543210')}
>
  Call Us
</a>

<a
  href="mailto:info@example.com"
  onClick={() => trackEmailClick('info@example.com')}
>
  Email Us
</a>
```

### 7. Track Funnel Steps
```tsx
const { trackFunnelStep } = useConversionTracking();

// Booking funnel
trackFunnelStep('bike_booking', 'vehicle_selection', 1, 'visit');
trackFunnelStep('bike_booking', 'details_form', 2, 'visit');
trackFunnelStep('bike_booking', 'payment', 3, 'convert');
```

### 8. Track Form Submissions
```tsx
const { trackFormSubmit } = useConversionTracking();

const handleSubmit = (data) => {
  trackFormSubmit('Contact Form', {
    name: data.name,
    email: data.email,
  });
};
```

## Integration Checklist

### ✅ Already Done
- [x] Database schema created
- [x] Migration applied
- [x] Tracking service created
- [x] API endpoints created
- [x] React hooks created

### 🔄 Next Steps (Integrate into existing pages)

1. **Add to Booking Pages**
```tsx
// src/app/bike-booking/page.tsx
import { useConversionTracking } from '@/hooks/useConversionTracking';

const { trackQuoteRequest, trackBookingInitiated } = useConversionTracking();
```

2. **Add to Search Components**
```tsx
// src/components/SearchBar.tsx
const { trackSearch, trackFilter } = useConversionTracking();
```

3. **Add to Payment Pages**
```tsx
// src/app/payment/page.tsx
const { trackPaymentInitiated, trackPaymentCompleted } = useConversionTracking();
```

4. **Add to Quote Pages**
```tsx
// src/app/quotes/page.tsx
const { trackQuoteView } = useConversionTracking();
```

## Analytics Dashboards

### Conversion Analytics
```tsx
const response = await fetch('/api/admin/analytics/conversion?dateRange=30');
const data = await response.json();

// Available data:
// - summary (visits, bookings, revenue, conversion rate)
// - conversionsByType
// - bookingsByType
// - funnel (step-by-step conversions)
// - sourcePerformance (which sources convert best)
// - topPages (highest converting pages)
// - dailyTrend
// - devicePerformance
```

### Keyword Analytics
```tsx
const response = await fetch('/api/admin/analytics/keywords?dateRange=30&sortBy=revenue');
const data = await response.json();

// Available data:
// - summary (total keywords, clicks, conversions, revenue)
// - topKeywords (with CTR, conversion rate, revenue per click)
// - keywordTrends (daily trends for top keywords)
// - keywordsByBookingType (which keywords drive which bookings)
```

### User Flow Analytics
```tsx
const response = await fetch('/api/admin/analytics/flow?dateRange=7');
const data = await response.json();

// Available data:
// - flows (page-to-page navigation for Sankey diagram)
// - entryPages (top landing pages)
// - exitPages (where users leave)
// - conversionPaths (successful booking journeys)
// - dropoffPoints (pages with high exit rates)
// - deviceFlows (flow patterns by device)
// - pathDepths (how deep users go)
```

### Attribution Analytics
```tsx
const response = await fetch('/api/admin/analytics/attribution?dateRange=30');
const data = await response.json();

// Available data:
// - summary (total bookings, revenue, avg time to convert)
// - firstTouchAttribution (which source started the journey)
// - lastTouchAttribution (which source closed the booking)
// - attributionByBookingType
// - topKeywords (keywords that drive bookings)
// - timeToConvertBuckets
// - topLandingPages
```

## Key Insights You Can Get

### 📊 Traffic Analysis
- **Which pages get most traffic?** → `/api/admin/analytics/conversion` → topPages
- **Which keywords bring most traffic?** → `/api/admin/analytics/keywords` → topKeywords

### 💰 Revenue Analysis
- **Which source brings most bookings?** → `/api/admin/analytics/attribution` → firstTouchAttribution
- **Which keywords generate most revenue?** → `/api/admin/analytics/keywords` → sortBy=revenue
- **Which landing page converts best?** → `/api/admin/analytics/attribution` → topLandingPages

### 🔄 User Behavior
- **How far do users go?** → `/api/admin/analytics/flow` → pathDepths
- **Where do users drop off?** → `/api/admin/analytics/flow` → dropoffPoints
- **What's the conversion path?** → `/api/admin/analytics/flow` → conversionPaths

### 📈 Funnel Optimization
- **Which funnel step has lowest conversion?** → `/api/admin/analytics/conversion` → funnel
- **Device performance?** → `/api/admin/analytics/conversion` → devicePerformance

## Attribution Models

### First-Touch Attribution
Credits the first source that brought the user
- Best for: Measuring awareness campaigns
- Use case: "Which ads bring new users?"

### Last-Touch Attribution
Credits the last source before booking
- Best for: Measuring closing effectiveness
- Use case: "What pushes users to book?"

## Event Types
1. **PAGE_VISIT** - Auto-tracked on every page
2. **SEARCH** - User searches (tracks keyword)
3. **FILTER_APPLIED** - User applies filters
4. **QUOTE_VIEW** - User views quote
5. **QUOTE_REQUEST** - User requests quote
6. **QUOTE_RECEIVED** - User receives quote
7. **BOOKING_INITIATED** - User starts booking
8. **BOOKING_COMPLETED** - Booking confirmed ✅
9. **PAYMENT_INITIATED** - Payment started
10. **PAYMENT_COMPLETED** - Payment successful
11. **FORM_SUBMITTED** - Any form submitted
12. **CTA_CLICKED** - Call-to-action clicked
13. **CHAT_OPENED** - Chat widget opened
14. **PHONE_CLICKED** - Phone number clicked
15. **EMAIL_CLICKED** - Email link clicked

## Attribution Data Automatically Captured
- Traffic source (organic, direct, social, paid, referral)
- UTM parameters (source, medium, campaign)
- Keywords (from search or URL params)
- Landing page
- Referrer
- Device, browser, OS
- Country, city (if available)

## Example: Complete Bike Booking Tracking

```tsx
'use client';
import { useConversionTracking } from '@/hooks/useConversionTracking';

export default function BikeBookingPage() {
  const {
    trackSearch,
    trackFilter,
    trackQuoteView,
    trackBookingInitiated,
    trackBookingCompleted,
    trackFunnelStep,
  } = useConversionTracking();

  const handleSearch = (query) => {
    trackSearch(query);
    trackFunnelStep('bike_booking', 'search', 1, 'visit');
  };

  const handleFilterApply = (filterType, value) => {
    trackFilter(filterType, value);
  };

  const handleViewQuote = (quoteId) => {
    trackQuoteView(quoteId, 'bike');
    trackFunnelStep('bike_booking', 'quote_view', 2, 'visit');
  };

  const handleStartBooking = () => {
    trackBookingInitiated('bike', { /* booking data */ });
    trackFunnelStep('bike_booking', 'booking_start', 3, 'visit');
  };

  const handleBookingSuccess = (bookingId, amount) => {
    trackBookingCompleted(bookingId, 'bike', amount, amount * 0.1);
    trackFunnelStep('bike_booking', 'booking_complete', 4, 'convert');
  };

  return <div>...</div>;
}
```

## 🎯 Next Actions
1. Integrate tracking into existing booking flows
2. Create analytics dashboards in admin panel
3. Build visualization components (funnels, Sankey diagrams)
4. Set up automated reports
5. Create alerts for conversion drops
