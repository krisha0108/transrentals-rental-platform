# Location-Aware System - Complete Integration Guide

## Overview

TransRentals website now has **full location awareness** throughout the entire platform. All pages automatically detect and respond to location changes, ensuring customers always see relevant content for their selected city.

---

## 🎯 How Location System Works

### 1. **Automatic Location Detection**
When a user first visits the website:
- Browser-based geolocation API attempts to detect user's location
- If successful, finds nearest city from our 206+ Indian cities database
- Falls back to Mumbai (default) if detection fails
- Stores selected location in localStorage for persistence

### 2. **Manual Location Selection**
Users can change their location anytime via:
- **Homepage**: LocationSelector in header top bar (orange dropdown)
- **Customer Portal**: Location badge in dashboard top bar
- **Search**: Type to search from 206+ cities
- **Popular Cities**: Quick select from 12 most popular cities
- **Auto-detect**: "Detect My Location" button for GPS detection

### 3. **Location Propagation**
When location changes:
- `LocationContext` updates `currentCity` state
- Custom event `cityChanged` dispatched to window
- All components using `useLocation()` hook automatically re-render
- New location saved to localStorage
- All booking forms prefill with new location

---

## 📍 Location Display Across Pages

### **Public Pages (Header)**
```
Top Bar:
┌──────────────────────────────────────────────────┐
│ 📞 +91-XXX  📍 150+ Cities  [Mumbai ▼] Vendor... │
└──────────────────────────────────────────────────┘
```
- **Orange dropdown** with current city name
- Click to open location selector modal
- Search or browse 206+ cities
- Changes reflect instantly across entire site

### **Customer Portal (Dashboard)**
```
Dashboard Top Bar:
┌──────────────────────────────────────────────────┐
│ My Bookings     [📍 Mumbai]  🔔  👤            │
└──────────────────────────────────────────────────┘
```
- **Green badge** showing current booking location
- Hover to see full location details (city + state)
- Click to navigate to homepage for location change
- Visible on all customer portal pages

---

## 🔧 Technical Implementation

### **Context Provider** (`src/contexts/LocationContext.tsx`)

```typescript
// Available functions:
- currentCity: City          // Currently selected city object
- locationData: LocationData // Full location details
- isDetecting: boolean       // Loading state
- setCity(city: City)        // Manually set location
- refreshLocation()          // Re-detect location
```

### **Custom Hooks**

```typescript
// 1. Get current location
import { useLocation } from '@/contexts/LocationContext';
const { currentCity, setCity } = useLocation();

// 2. Get city-specific URL
import { useCityUrl } from '@/contexts/LocationContext';
const bikeRentalUrl = useCityUrl('/bike-on-rent'); // → /mumbai/bike-on-rent

// 3. Get city-specific metadata
import { useCityMetadata } from '@/contexts/LocationContext';
const { title, description, keywords } = useCityMetadata();
```

### **Event Listening**

Components can listen to location changes:

```typescript
useEffect(() => {
  const handleCityChange = (event: CustomEvent) => {
    const newCity = event.detail;
    console.log('City changed to:', newCity.name);
    // Reload data for new city
  };

  window.addEventListener('cityChanged', handleCityChange);
  return () => window.removeEventListener('cityChanged', handleCityChange);
}, []);
```

---

## 🌐 Location-Aware Pages

### **1. Homepage**
- Hero section shows city-specific content
- "Rent in {City Name}" dynamic text
- Available vehicles filtered by city
- Popular routes from current city
- FAQs customized for location

### **2. Service Pages** (e.g., /bike-on-rent)
- Dynamic URLs: `/bike-on-rent/{city-slug}`
- City-specific SEO metadata
- Location-aware booking forms
- Nearby locations suggestions
- Local pricing and availability

### **3. Customer Dashboard**
- Shows current booking location in top bar
- New bookings prefilled with current city
- Booking history shows pickup locations
- Quotations from vendors in current city

### **4. Booking Forms** (All 12 Types)
- Pickup location auto-filled
- Dropoff suggestions based on current city
- Popular routes from current location
- Service availability validation

### **5. Chat Interface**
- Vendor locations displayed
- Distance from current city
- Local contact info prioritized

### **6. Profile & Wallet**
- Service history by location
- Token earnings per city
- Location-based offers

---

## 📱 User Experience Flow

### **First Visit**
```
1. User lands on homepage
   ↓
2. Auto-detect location (Mumbai detected)
   ↓
3. Homepage shows: "Rent Bikes in Mumbai"
   ↓
4. User browses bikes available in Mumbai
   ↓
5. Booking form prefilled with "Mumbai"
```

### **Changing Location**
```
1. User clicks location dropdown [Mumbai ▼]
   ↓
2. Searches for "Bangalore"
   ↓
3. Selects "Bangalore, Karnataka"
   ↓
4. Homepage instantly updates: "Rent Bikes in Bangalore"
   ↓
5. All services now show Bangalore pricing
   ↓
6. New bookings use Bangalore as pickup
```

### **Customer Portal**
```
1. User logs in → Dashboard
   ↓
2. Top bar shows [📍 Mumbai] badge
   ↓
3. Creates new booking → Prefilled with Mumbai
   ↓
4. Clicks location badge → Goes to homepage
   ↓
5. Changes to Delhi → Returns to dashboard
   ↓
6. New booking now uses Delhi
```

---

## 🎨 Visual Indicators

### **Location Badges**

**Header (Public):**
```
┌─────────────────┐
│ 📍 Mumbai    ▼  │  ← Orange, clickable dropdown
└─────────────────┘
```

**Dashboard (Customer):**
```
┌──────────────┐
│ 📍 Mumbai    │  ← Green, hover for details
└──────────────┘
```

### **Location Selector Modal**

```
╔════════════════════════════════════╗
║  Select Your City                  ║
║  We'll show you relevant services  ║
╠════════════════════════════════════╣
║  🔍 Search for your city...        ║
╠════════════════════════════════════╣
║  🧭 Detect My Location             ║
╠════════════════════════════════════╣
║  Popular Cities                    ║
║  📍 Mumbai, Maharashtra        ✓   ║
║  📍 Delhi, Delhi                   ║
║  📍 Bangalore, Karnataka           ║
║  📍 Chennai, Tamil Nadu            ║
║  ...                               ║
╚════════════════════════════════════╝
```

---

## 🚀 Features Enabled by Location System

### **1. Dynamic Content**
- Hero titles with city name
- Location-specific testimonials
- City-aware blog posts
- Local vendor showcases

### **2. SEO Optimization**
- 10,100+ location-specific pages
- City in page titles & meta descriptions
- Local schema markup
- Geo-targeted sitemaps

### **3. Smart Prefilling**
- All booking forms auto-filled
- Destination suggestions
- Popular routes
- Service availability

### **4. Personalization**
- Remember last location
- Recent city history
- Favorite locations
- Multi-city bookings

### **5. Business Logic**
- Vendor matching by location
- Pricing variations per city
- Service availability checks
- Distance calculations

---

## 🔄 Location Change Behavior

### **What Updates Automatically:**
✅ Homepage hero title
✅ Service page URLs
✅ Booking form pickups
✅ Available vehicles list
✅ Popular routes
✅ FAQs and content
✅ SEO metadata
✅ Vendor suggestions
✅ Pricing estimates

### **What Requires Manual Reload:**
- Active booking in progress (shows warning)
- Ongoing vendor chat (maintains context)
- Submitted forms (prevents data loss)

---

## 💾 Data Persistence

### **localStorage**
```javascript
{
  "location": {
    "city": {
      "id": 1,
      "name": "Mumbai",
      "slug": "mumbai",
      "state": "Maharashtra"
    },
    "detectionMethod": "manual",
    "timestamp": 1700000000000
  }
}
```

### **Session Continuity**
- Location persists across page refreshes
- Survives browser close/reopen
- Syncs across tabs (same domain)
- Cleared on logout (optional)

---

## 🎯 Integration Points

### **Components Using Location:**

1. **Header** → LocationSelector dropdown
2. **DashboardLayout** → Location badge with tooltip
3. **Homepage** → Hero, services, vehicles
4. **Service Pages** → Dynamic routing & content
5. **Booking Forms** → Prefilled pickup/dropoff
6. **Search** → Location-filtered results
7. **Footer** → City-specific links
8. **Chatbot** → Location-aware responses

### **API Calls with Location:**

```typescript
// All booking APIs send location
POST /customer-bike-booking
{
  "location_id": 1,
  "location_name": "Mumbai",
  ...
}

// Vendor matching uses location
GET /vendors?city=mumbai

// Quotations filtered by location
GET /quotations?booking_id=123&city=mumbai
```

---

## 📊 Supported Cities

- **Total**: 206+ Indian cities
- **Tier 1**: 19 metros (Mumbai, Delhi, etc.)
- **Tier 2**: 50 cities
- **Tier 3**: 100 tourist destinations
- **Tier 4**: 118 emerging markets

### **Popular Cities (Quick Select):**
1. Mumbai, Maharashtra
2. Delhi, Delhi
3. Bangalore, Karnataka
4. Chennai, Tamil Nadu
5. Kolkata, West Bengal
6. Hyderabad, Telangana
7. Pune, Maharashtra
8. Ahmedabad, Gujarat
9. Jaipur, Rajasthan
10. Lucknow, Uttar Pradesh
11. Goa, Goa
12. Chandigarh, Chandigarh

---

## 🔒 Security & Privacy

- No sensitive location data stored
- GPS permission requested only when user clicks "Detect"
- Can disable geolocation and select manually
- Location cleared on account deletion
- No location tracking or analytics without consent

---

## 🎉 Summary

**TransRentals location system ensures:**
- Seamless city switching across all pages
- Instant content updates without page reload
- Persistent user preferences
- Smart booking form prefilling
- 10,100+ location-specific SEO pages
- Unified experience on desktop and mobile

**Location is now central to the entire user experience!** 🌍
