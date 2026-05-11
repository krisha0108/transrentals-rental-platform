# TransRentals — Complete Pages Inventory
> Total: 560 pages | Last updated: 2026-04-27

**Legend:**
- 🟢 **STATIC** — Hardcoded URL, no dynamic params, builds once
- 🔵 **DB-STATIC** — `generateStaticParams` → DB pe query → build time pe HTML banta hai
- 🟡 **ISR** — `dynamicParams=true` → pehli request pe banta hai, phir cache (1hr revalidate)
- 🔒 **PROTECTED** — Login required, server-side rendered on demand

---

## 1. PUBLIC STATIC PAGES

| URL | Type | Notes |
|-----|------|-------|
| `/` | 🟢 STATIC | Home page |
| `/about` | 🟢 STATIC | About TransRentals |
| `/contact` | 🟢 STATIC | Contact page |
| `/faq` | 🟢 STATIC | FAQ page |
| `/fleet` | 🟢 STATIC | Fleet showcase |
| `/services` | 🟢 STATIC | All services listing |
| `/privacy-policy` | 🟢 STATIC | Privacy Policy |
| `/terms-conditions` | 🟢 STATIC | Terms & Conditions |
| `/cancellation-policy` | 🟢 STATIC | Cancellation Policy |
| `/refund-policy` | 🟢 STATIC | Refund Policy |
| `/custom-booking` | 🟢 STATIC | Custom booking page |
| `/guide/vendor` | 🟢 STATIC | Vendor guide page |

---

## 2. CATCH-ALL CITY / STATE / CMS PAGES

| URL Pattern | Type | Source | Notes |
|-------------|------|--------|-------|
| `/[slug]` | 🔵 DB-STATIC + 🟡 ISR | `locations` table + `pages` table + static `indian-cities.ts` | Handles 150+ cities, 28 states, CMS pages |

**Examples generated:**
- `/ahmedabad`, `/mumbai`, `/delhi`, `/bangalore` ... (all active cities)
- `/gujarat`, `/maharashtra`, `/rajasthan` ... (all states)
- CMS pages from `pages` table where `status = PUBLISHED`

---

## 3. SERVICE PAGES — CAR RENTAL

| URL | Type | Source |
|-----|------|--------|
| `/car-rental` | 🟢 STATIC | — |
| `/car-rental/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table (car-rental service) |
| `/car-rental/[location]/book` | 🟡 ISR | On-demand |
| `/self-drive-car-rentals` | 🟢 STATIC | — |
| `/self-drive-car-rentals/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/self-drive-car-rentals/[location]/book` | 🟡 ISR | On-demand |
| `/self-drive-car-rentals/[location]/cars` | 🟡 ISR | On-demand |
| `/self-drive-hatchback-rental` | 🟢 STATIC | — |
| `/self-drive-hatchback-rental/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/self-drive-sedan-rental` | 🟢 STATIC | — |
| `/self-drive-sedan-rental/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/self-drive-suv-rental` | 🟢 STATIC | — |
| `/self-drive-suv-rental/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/outstation-cab` | 🟢 STATIC | — |
| `/outstation-cab/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table (city slugs) + `COMING_SOON_SLUGS` (route slugs) |
| `/outstation-car-rental` | 🟢 STATIC | — |
| `/outstation-car-rental/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/one-way-car-rental` | 🟢 STATIC | — |
| `/one-way-car-rental/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/hourly-car-rental` | 🟢 STATIC | — |
| `/hourly-car-rental/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/monthly-car-rental` | 🟢 STATIC | — |
| `/monthly-car-rental/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/luxury-car-rental` | 🟢 STATIC | — |
| `/luxury-car-rental/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/luxury-car-rental/[location]/book` | 🟡 ISR | On-demand |
| `/sports-car-rental` | 🟢 STATIC | — |
| `/sports-car-rental/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/vintage-car-rental` | 🟢 STATIC | — |
| `/vintage-car-rental/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/corporate-car-rental` | 🟢 STATIC | — |
| `/corporate-car-rental/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/wedding-car-rental` | 🟢 STATIC | — |
| `/wedding-car-rental/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |

---

## 4. SERVICE PAGES — SPECIFIC CAR MODELS

| URL | Type | Source |
|-----|------|--------|
| `/innova-on-rent` | 🟢 STATIC | — |
| `/innova-on-rent/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/creta-on-rent` | 🟢 STATIC | — |
| `/creta-on-rent/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/scorpio-on-rent` | 🟢 STATIC | — |
| `/scorpio-on-rent/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/fortuner-on-rent` | 🟢 STATIC | — |
| `/fortuner-on-rent/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/swift-on-rent` | 🟢 STATIC | — |
| `/swift-on-rent/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/seltos-on-rent` | 🟢 STATIC | — |
| `/seltos-on-rent/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/xuv700-on-rent` | 🟢 STATIC | — |
| `/xuv700-on-rent/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |

---

## 5. SERVICE PAGES — TWO WHEELER RENTAL

| URL | Type | Source |
|-----|------|--------|
| `/bike-on-rent` | 🟢 STATIC | — |
| `/bike-on-rent/[location]` | 🔵 DB-STATIC + 🟡 ISR | `locations` table (direct Prisma query) |
| `/bike-on-rent/[location]/bikes` | 🟡 ISR | On-demand |
| `/bike-on-rent/book` | 🟢 STATIC | — |
| `/royal-enfield-on-rent` | 🟢 STATIC | — |
| `/royal-enfield-on-rent/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/ktm-on-rent` | 🟢 STATIC | — |
| `/ktm-on-rent/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/himalayan-on-rent` | 🟢 STATIC | — |
| `/himalayan-on-rent/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/pulsar-on-rent` | 🟢 STATIC | — |
| `/pulsar-on-rent/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/splendor-on-rent` | 🟢 STATIC | — |
| `/splendor-on-rent/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/apache-on-rent` | 🟢 STATIC | — |
| `/apache-on-rent/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/activa-on-rent` | 🟢 STATIC | — |
| `/activa-on-rent/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/electric-scooter-rental` | 🟢 STATIC | — |
| `/electric-scooter-rental/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/monthly-bike-rental` | 🟢 STATIC | — |
| `/monthly-bike-rental/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |

---

## 6. SERVICE PAGES — BIKE TOURS & TRIPS

| URL | Type | Source |
|-----|------|--------|
| `/bike-tours` | 🟢 STATIC | — |
| `/bike-tours/goa` | 🟢 STATIC | Hardcoded |
| `/bike-tours/leh-ladakh` | 🟢 STATIC | Hardcoded |
| `/bike-tours/rajasthan` | 🟢 STATIC | Hardcoded |
| `/bike-tours/spiti-valley` | 🟢 STATIC | Hardcoded |
| `/bike-trips` | 🟢 STATIC | — |
| `/bike-trips/ladakh` | 🟢 STATIC | Hardcoded |

---

## 7. SERVICE PAGES — BUS & GROUP TRAVEL

| URL | Type | Source |
|-----|------|--------|
| `/bus-rental` | 🟢 STATIC | — |
| `/bus-rental/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/corporate-bus-rental` | 🟢 STATIC | — |
| `/corporate-bus-rental/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/wedding-bus-rental` | 🟢 STATIC | — |
| `/wedding-bus-rental/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/tempo-traveller` | 🟢 STATIC | — |
| `/tempo-traveller/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/12-seater-tempo-traveller` | 🟢 STATIC | — |
| `/12-seater-tempo-traveller/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/17-seater-tempo-traveller` | 🟢 STATIC | — |
| `/17-seater-tempo-traveller/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/20-seater-tempo-traveller` | 🟢 STATIC | — |
| `/20-seater-tempo-traveller/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/26-seater-bus` | 🟢 STATIC | — |
| `/26-seater-bus/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |

---

## 8. SERVICE PAGES — TAXI & POINT-TO-POINT

| URL | Type | Source |
|-----|------|--------|
| `/local-taxi` | 🟢 STATIC | — |
| `/local-taxi/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/chauffeur-service` | 🟢 STATIC | — |
| `/chauffeur-service/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/chauffeur-service/[location]/book` | 🟡 ISR | On-demand |

---

## 9. SERVICE PAGES — INTERCITY ROUTES

| URL | Type | Source |
|-----|------|--------|
| `/airport-transfer` | 🟢 STATIC | — |
| `/airport-transfer/[slug]` | 🔵 DB-STATIC + 🟡 ISR | `chauffeur_route_packages` table (airport routes only) |
| `/one-way-cab` | 🟢 STATIC | — |
| `/one-way-cab/[route]` | 🔵 DB-STATIC + 🟡 ISR | `chauffeur_route_packages` table (city-to-city) |
| `/round-trip` | 🟢 STATIC | — |
| `/round-trip/[route]` | 🔵 DB-STATIC + 🟡 ISR | `chauffeur_route_packages` table (city-to-city, no airports) |

**Slug formats:**
- Airport: `/airport-transfer/ahmedabad-airport-to-city`
- One-way: `/one-way-cab/ahmedabad-to-mumbai`
- Round-trip: `/round-trip/ahmedabad-to-mumbai-round-trip`

---

## 10. SERVICE PAGES — LOGISTICS & EQUIPMENT

| URL | Type | Source |
|-----|------|--------|
| `/transporter` | 🟢 STATIC | — |
| `/transporter/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/mini-truck-rental` | 🟢 STATIC | — |
| `/mini-truck-rental/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/trailer-on-rent` | 🟢 STATIC | — |
| `/trailer-on-rent/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/packers-and-movers` | 🟢 STATIC | — |
| `/packers-and-movers/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/equipment-rental` | 🟢 STATIC | — |
| `/equipment-rental/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/jcb-on-rent` | 🟢 STATIC | — |
| `/jcb-on-rent/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/crane-on-rent` | 🟢 STATIC | — |
| `/crane-on-rent/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/excavator-on-rent` | 🟢 STATIC | — |
| `/excavator-on-rent/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/hydra-on-rent` | 🟢 STATIC | — |
| `/hydra-on-rent/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |
| `/generator-on-rent` | 🟢 STATIC | — |
| `/generator-on-rent/[location]` | 🔵 DB-STATIC + 🟡 ISR | `service_locations` table |

---

## 11. FLEET PAGES

| URL | Type | Source |
|-----|------|--------|
| `/fleet` | 🟢 STATIC | — |
| `/fleet/[vehicle]` | 🟡 ISR | On-demand |
| `/fleet/[vehicle]/[location]` | 🟡 ISR | On-demand |

---

## 12. BLOG PAGES

| URL | Type | Source |
|-----|------|--------|
| `/blog` | 🟡 ISR | `blog_posts` table, revalidate: 60s |
| `/blog/search` | 🟢 STATIC | — |
| `/blog/[slug]` | 🔵 DB-STATIC + 🟡 ISR | `blog_posts` table (top 20 pre-built, rest ISR) |
| `/blog/category/[slug]` | 🔵 DB-STATIC + 🟡 ISR | `blog_categories` table (top 20) |
| `/blog/author/[slug]` | 🔵 DB-STATIC + 🟡 ISR | `blog_authors` table (top 20) |
| `/blog/tag/[slug]` | 🔵 DB-STATIC + 🟡 ISR | `blog_tags` table (top 20) |
| `/blog/service/[serviceSlug]` | 🟡 ISR | On-demand |

---

## 13. WANDER & STORIES

| URL | Type | Source |
|-----|------|--------|
| `/wander` | 🟢 STATIC | — |
| `/wander/[id]` | 🟡 ISR | `wander_listings` table |
| `/wander/experiences/[slug]` | 🟡 ISR | Static data |
| `/wander/group/[groupCode]` | 🟡 ISR | On-demand |
| `/stories` | 🟢 STATIC | — |
| `/stories/[slug]` | 🟡 ISR | Static data |

---

## 14. BOOKING & PAYMENT PAGES

| URL | Type | Source |
|-----|------|--------|
| `/book/[vendorSlug]` | 🟡 ISR | On-demand |
| `/book/[vendorSlug]/[service]` | 🟡 ISR | On-demand |
| `/pay/[bookingNumber]` | 🟡 ISR | On-demand |
| `/track/[bookingNumber]` | 🟡 ISR | On-demand |
| `/trip/[tripCode]` | 🟡 ISR | On-demand |
| `/invoice/b2b/[id]` | 🟡 ISR | On-demand |

---

## 15. CUSTOMER PORTAL

| URL | Type |
|-----|------|
| `/customer` | 🔒 PROTECTED |
| `/customer/login` | 🟢 STATIC |
| `/customer/forgot-password` | 🟢 STATIC |
| `/customer/b2b-register` | 🟢 STATIC |
| `/customer/dashboard` | 🔒 PROTECTED |
| `/customer/chat` | 🔒 PROTECTED |
| `/customer/financials` | 🔒 PROTECTED |
| `/customer/helpdesk` | 🔒 PROTECTED |
| `/customer/wander-groups` | 🔒 PROTECTED |
| `/customer/booking/[id]` | 🔒 PROTECTED |
| `/customer/bike-bookings` | 🔒 PROTECTED |
| `/customer/bike-bookings/[id]` | 🔒 PROTECTED |
| `/customer/bike-quotes` | 🔒 PROTECTED |
| `/customer/bike-quotes/[id]` | 🔒 PROTECTED |
| `/customer/bus-bookings/[id]` | 🔒 PROTECTED |
| `/customer/bus-quotes` | 🔒 PROTECTED |
| `/customer/bus-quotes/[id]` | 🔒 PROTECTED |
| `/customer/car-bookings` | 🔒 PROTECTED |
| `/customer/car-bookings/[id]` | 🔒 PROTECTED |
| `/customer/car-rental-bookings` | 🔒 PROTECTED |
| `/customer/car-rental-bookings/[id]` | 🔒 PROTECTED |
| `/customer/equipment-bookings` | 🔒 PROTECTED |
| `/customer/equipment-bookings/[id]` | 🔒 PROTECTED |
| `/customer/equipment-quotes` | 🔒 PROTECTED |
| `/customer/equipment-quotes/[id]` | 🔒 PROTECTED |
| `/customer/luxury-bookings` | 🔒 PROTECTED |
| `/customer/luxury-bookings/[id]` | 🔒 PROTECTED |
| `/customer/luxury-quotes/[id]` | 🔒 PROTECTED |
| `/customer/packers-bookings/[id]` | 🔒 PROTECTED |
| `/customer/packers-quotes` | 🔒 PROTECTED |
| `/customer/packers-quotes/[id]` | 🔒 PROTECTED |
| `/customer/self-drive-bookings/[id]` | 🔒 PROTECTED |
| `/customer/self-drive-quotes` | 🔒 PROTECTED |
| `/customer/self-drive-quotes/[id]` | 🔒 PROTECTED |
| `/customer/truck-bookings/[id]` | 🔒 PROTECTED |
| `/customer/truck-quotes` | 🔒 PROTECTED |
| `/customer/truck-quotes/[id]` | 🔒 PROTECTED |
| `/customer/wander-quotes/[id]` | 🔒 PROTECTED |
| `/customer/b2b-bookings` | 🔒 PROTECTED |
| `/customer/b2b-bookings/create` | 🔒 PROTECTED |
| `/customer/b2b-bookings/invoices` | 🔒 PROTECTED |
| `/customer/b2b-bookings/[id]` | 🔒 PROTECTED |

---

## 16. VENDOR PORTAL

| URL | Type |
|-----|------|
| `/vendor` | 🟢 STATIC |
| `/vendor/login` | 🟢 STATIC |
| `/vendor/register` | 🟢 STATIC |
| `/vendor/forgot-password` | 🟢 STATIC |
| `/vendor/dashboard` | 🔒 PROTECTED |
| `/vendor/profile` | 🔒 PROTECTED |
| `/vendor/earnings` | 🔒 PROTECTED |
| `/vendor/bookings` | 🔒 PROTECTED |
| `/vendor/all-bookings` | 🔒 PROTECTED |
| `/vendor/fleet` | 🔒 PROTECTED |
| `/vendor/fleet/add` | 🔒 PROTECTED |
| `/vendor/fleet/[id]` | 🔒 PROTECTED |
| `/vendor/fleet/[id]/edit` | 🔒 PROTECTED |
| `/vendor/fleet/analytics` | 🔒 PROTECTED |
| `/vendor/fleet/documents` | 🔒 PROTECTED |
| `/vendor/fleet/fuel` | 🔒 PROTECTED |
| `/vendor/fleet/incidents` | 🔒 PROTECTED |
| `/vendor/fleet/service` | 🔒 PROTECTED |
| `/vendor/locations` | 🔒 PROTECTED |
| `/vendor/locations/request` | 🔒 PROTECTED |
| `/vendor/services` | 🔒 PROTECTED |
| `/vendor/services/request` | 🔒 PROTECTED |
| `/vendor/documents` | 🔒 PROTECTED |
| `/vendor/documents/alerts` | 🔒 PROTECTED |
| `/vendor/bank-details` | 🔒 PROTECTED |
| `/vendor/wallet` | 🔒 PROTECTED |
| `/vendor/payments` | 🔒 PROTECTED |
| `/vendor/rates` | 🔒 PROTECTED |
| `/vendor/routes` | 🔒 PROTECTED |
| `/vendor/reviews` | 🔒 PROTECTED |
| `/vendor/notifications` | 🔒 PROTECTED |
| `/vendor/notification-settings` | 🔒 PROTECTED |
| `/vendor/chat` | 🔒 PROTECTED |
| `/vendor/support` | 🔒 PROTECTED |
| `/vendor/audit-logs` | 🔒 PROTECTED |
| `/vendor/calendar` | 🔒 PROTECTED |
| `/vendor/direct-bookings` | 🔒 PROTECTED |
| `/vendor/direct-bookings/add` | 🔒 PROTECTED |
| `/vendor/direct-bookings/[id]` | 🔒 PROTECTED |
| `/vendor/booking-links` | 🔒 PROTECTED |
| `/vendor/quotations` | 🔒 PROTECTED |
| `/vendor/quotations/create` | 🔒 PROTECTED |
| `/vendor/invoices` | 🔒 PROTECTED |
| `/vendor/get-started` | 🔒 PROTECTED |
| `/vendor/checklist` | 🔒 PROTECTED |
| `/vendor/staff` | 🔒 PROTECTED |
| `/vendor/staff/add` | 🔒 PROTECTED |
| `/vendor/staff/attendance` | 🔒 PROTECTED |
| `/vendor/staff/payroll` | 🔒 PROTECTED |
| `/vendor/staff/[id]` | 🔒 PROTECTED |
| `/vendor/staff/[id]/edit` | 🔒 PROTECTED |
| **Bus Service** | |
| `/vendor/bus/requests` | 🔒 PROTECTED |
| `/vendor/bus/requests/[id]/quote` | 🔒 PROTECTED |
| `/vendor/bus/quotes` | 🔒 PROTECTED |
| `/vendor/bus/quotes/[id]` | 🔒 PROTECTED |
| `/vendor/bus/bookings` | 🔒 PROTECTED |
| `/vendor/bus/bookings/[id]` | 🔒 PROTECTED |
| `/vendor/bus/bookings/cancelled` | 🔒 PROTECTED |
| `/vendor/bus/earnings` | 🔒 PROTECTED |
| `/vendor/bus/fleet` | 🔒 PROTECTED |
| `/vendor/bus/templates` | 🔒 PROTECTED |
| `/vendor/bus/templates/create` | 🔒 PROTECTED |
| `/vendor/bus/templates/[id]/edit` | 🔒 PROTECTED |
| **Bike Rental** | |
| `/vendor/bike-rentals/requests` | 🔒 PROTECTED |
| `/vendor/bike-rentals/requests/[id]/quote` | 🔒 PROTECTED |
| `/vendor/bike-rentals/quotes` | 🔒 PROTECTED |
| `/vendor/bike-rentals/quotes/[id]` | 🔒 PROTECTED |
| `/vendor/bike-rentals/bookings` | 🔒 PROTECTED |
| `/vendor/bike-rentals/bookings/[id]` | 🔒 PROTECTED |
| `/vendor/bike-rentals/bookings/cancelled` | 🔒 PROTECTED |
| `/vendor/bike-rentals/bookings/direct` | 🔒 PROTECTED |
| `/vendor/bike-rentals/bookings/open` | 🔒 PROTECTED |
| `/vendor/bike-rentals/earnings` | 🔒 PROTECTED |
| `/vendor/bike/templates` | 🔒 PROTECTED |
| `/vendor/bike/templates/create` | 🔒 PROTECTED |
| `/vendor/bike/templates/[id]/edit` | 🔒 PROTECTED |
| **Car Rental** | |
| `/vendor/car-rental/bookings` | 🔒 PROTECTED |
| `/vendor/car-rental/bookings/[bookingNumber]` | 🔒 PROTECTED |
| `/vendor/car-rental/bookings/cancelled` | 🔒 PROTECTED |
| `/vendor/car-rental/earnings` | 🔒 PROTECTED |
| **Self Drive** | |
| `/vendor/self-drive/requests` | 🔒 PROTECTED |
| `/vendor/self-drive/requests/[id]/quote` | 🔒 PROTECTED |
| `/vendor/self-drive/quotes` | 🔒 PROTECTED |
| `/vendor/self-drive/quotes/[id]` | 🔒 PROTECTED |
| `/vendor/self-drive/bookings` | 🔒 PROTECTED |
| `/vendor/self-drive/bookings/[id]` | 🔒 PROTECTED |
| `/vendor/self-drive/bookings/cancelled` | 🔒 PROTECTED |
| `/vendor/self-drive/bookings/direct` | 🔒 PROTECTED |
| `/vendor/self-drive/bookings/open` | 🔒 PROTECTED |
| `/vendor/self-drive/earnings` | 🔒 PROTECTED |
| `/vendor/self-drive/fleet` | 🔒 PROTECTED |
| `/vendor/self-drive/fleet/add` | 🔒 PROTECTED |
| `/vendor/self-drive/templates` | 🔒 PROTECTED |
| **Luxury** | |
| `/vendor/luxury/bookings` | 🔒 PROTECTED |
| `/vendor/luxury/bookings/[id]` | 🔒 PROTECTED |
| `/vendor/luxury/bookings/active` | 🔒 PROTECTED |
| `/vendor/luxury/bookings/cancelled` | 🔒 PROTECTED |
| `/vendor/luxury/earnings` | 🔒 PROTECTED |
| `/vendor/luxury/fleet` | 🔒 PROTECTED |
| `/vendor/luxury/fleet/add` | 🔒 PROTECTED |
| `/vendor/luxury/quotes/[id]` | 🔒 PROTECTED |
| `/vendor/luxury/rates` | 🔒 PROTECTED |
| `/vendor/luxury/send-quote/[id]` | 🔒 PROTECTED |
| `/vendor/luxury/templates` | 🔒 PROTECTED |
| **Packers** | |
| `/vendor/packers/requests` | 🔒 PROTECTED |
| `/vendor/packers/requests/[id]/quote` | 🔒 PROTECTED |
| `/vendor/packers/quotes` | 🔒 PROTECTED |
| `/vendor/packers/quotes/[id]` | 🔒 PROTECTED |
| `/vendor/packers/bookings` | 🔒 PROTECTED |
| `/vendor/packers/bookings/[id]` | 🔒 PROTECTED |
| `/vendor/packers/bookings/cancelled` | 🔒 PROTECTED |
| `/vendor/packers/earnings` | 🔒 PROTECTED |
| `/vendor/packers/templates` | 🔒 PROTECTED |
| **Equipment** | |
| `/vendor/equipment/requests` | 🔒 PROTECTED |
| `/vendor/equipment/requests/[id]/quote` | 🔒 PROTECTED |
| `/vendor/equipment/quotes` | 🔒 PROTECTED |
| `/vendor/equipment/quotes/[id]` | 🔒 PROTECTED |
| `/vendor/equipment/bookings` | 🔒 PROTECTED |
| `/vendor/equipment/bookings/[id]` | 🔒 PROTECTED |
| `/vendor/equipment/bookings/cancelled` | 🔒 PROTECTED |
| `/vendor/equipment/earnings` | 🔒 PROTECTED |
| `/vendor/equipment/templates` | 🔒 PROTECTED |
| **Transporter** | |
| `/vendor/transporter/requests` | 🔒 PROTECTED |
| `/vendor/transporter/requests/[id]/quote` | 🔒 PROTECTED |
| `/vendor/transporter/quotes` | 🔒 PROTECTED |
| `/vendor/transporter/quotes/[id]` | 🔒 PROTECTED |
| `/vendor/transporter/bookings` | 🔒 PROTECTED |
| `/vendor/transporter/bookings/[id]` | 🔒 PROTECTED |
| `/vendor/transporter/bookings/cancelled` | 🔒 PROTECTED |
| `/vendor/transporter/earnings` | 🔒 PROTECTED |
| `/vendor/transporter/fleet` | 🔒 PROTECTED |
| `/vendor/transporter/templates` | 🔒 PROTECTED |
| **Truck** | |
| `/vendor/truck/requests` | 🔒 PROTECTED |
| `/vendor/truck/requests/[id]/quote` | 🔒 PROTECTED |
| `/vendor/truck/quotes` | 🔒 PROTECTED |
| `/vendor/truck/bookings` | 🔒 PROTECTED |
| `/vendor/truck/bookings/[id]` | 🔒 PROTECTED |
| `/vendor/truck/earnings` | 🔒 PROTECTED |
| **Mini Truck** | |
| `/vendor/mini-truck/requests` | 🔒 PROTECTED |
| `/vendor/mini-truck/requests/[id]/quote` | 🔒 PROTECTED |
| `/vendor/mini-truck/bookings` | 🔒 PROTECTED |
| `/vendor/mini-truck/earnings` | 🔒 PROTECTED |
| **Trailer** | |
| `/vendor/trailer/requests` | 🔒 PROTECTED |
| `/vendor/trailer/bookings` | 🔒 PROTECTED |
| `/vendor/trailer/earnings` | 🔒 PROTECTED |
| **JCB** | |
| `/vendor/jcb/requests` | 🔒 PROTECTED |
| `/vendor/jcb/bookings` | 🔒 PROTECTED |
| `/vendor/jcb/earnings` | 🔒 PROTECTED |
| **B2B** | |
| `/vendor/b2b-bookings` | 🔒 PROTECTED |
| `/vendor/b2b-bookings/my-quotes` | 🔒 PROTECTED |
| `/vendor/b2b-bookings/[id]` | 🔒 PROTECTED |
| `/vendor/b2b-bookings/[id]/assign` | 🔒 PROTECTED |
| `/vendor/b2b-bookings/[id]/quote` | 🔒 PROTECTED |
| **Wander** | |
| `/vendor/wander` | 🔒 PROTECTED |
| `/vendor/wander/listings` | 🔒 PROTECTED |
| `/vendor/wander/listings/new` | 🔒 PROTECTED |
| `/vendor/wander/listings/[id]` | 🔒 PROTECTED |
| `/vendor/wander/bookings` | 🔒 PROTECTED |
| `/vendor/wander/bookings/[id]` | 🔒 PROTECTED |
| `/vendor/wander/quotes` | 🔒 PROTECTED |
| `/vendor/wander/quotes/[id]` | 🔒 PROTECTED |
| `/vendor/wander/reviews` | 🔒 PROTECTED |
| `/vendor/wander/analytics` | 🔒 PROTECTED |
| **Social** | |
| `/vendor/social` | 🔒 PROTECTED |
| `/vendor/social/create` | 🔒 PROTECTED |
| `/vendor/social/messages` | 🔒 PROTECTED |
| `/vendor/social/messages/[conversationId]` | 🔒 PROTECTED |
| `/vendor/social/profile/me` | 🔒 PROTECTED |
| `/vendor/social/profile/[vendorId]` | 🔒 PROTECTED |
| `/vendor/social/saved` | 🔒 PROTECTED |
| **P2P** | |
| `/vendor/p2p` | 🔒 PROTECTED |
| `/vendor/p2p/bookings` | 🔒 PROTECTED |
| `/vendor/p2p/bookings/post` | 🔒 PROTECTED |
| `/vendor/p2p/my-postings` | 🔒 PROTECTED |
| `/vendor/p2p/vehicles` | 🔒 PROTECTED |
| `/vendor/p2p/vehicles/post` | 🔒 PROTECTED |
| `/vendor/p2p/activity` | 🔒 PROTECTED |

---

## 17. DRIVER PORTAL

| URL | Type |
|-----|------|
| `/driver` | 🟢 STATIC |
| `/driver/login` | 🟢 STATIC |
| `/driver/register` | 🟢 STATIC |
| `/driver/dashboard` | 🔒 PROTECTED |
| `/driver/profile` | 🔒 PROTECTED |
| `/driver/profile/edit` | 🔒 PROTECTED |
| `/driver/bookings` | 🔒 PROTECTED |
| `/driver/bookings/[bookingNumber]` | 🔒 PROTECTED |
| `/driver/available-trips` | 🔒 PROTECTED |
| `/driver/earnings` | 🔒 PROTECTED |
| `/driver/earnings/history` | 🔒 PROTECTED |
| `/driver/notifications` | 🔒 PROTECTED |
| `/driver/fleet` | 🔒 PROTECTED |
| `/driver/fleet/add` | 🔒 PROTECTED |
| `/driver/fleet/[id]` | 🔒 PROTECTED |
| `/driver/fleet/[id]/edit` | 🔒 PROTECTED |
| `/driver/fleet/[id]/fuel/add` | 🔒 PROTECTED |
| `/driver/fleet/[id]/fuel/[logId]/edit` | 🔒 PROTECTED |
| `/driver/fleet/[id]/maintenance/add` | 🔒 PROTECTED |
| `/driver/fleet/[id]/maintenance/[logId]/edit` | 🔒 PROTECTED |
| `/driver/fleet/[id]/incidents/add` | 🔒 PROTECTED |
| `/driver/fleet/[id]/incidents/[incidentId]/edit` | 🔒 PROTECTED |

---

## 18. ADMIN PORTAL

| URL | Type |
|-----|------|
| `/admin/login` | 🟢 STATIC |
| `/admin/dashboard` | 🔒 PROTECTED |
| `/admin/analytics` | 🔒 PROTECTED |
| `/admin/analytics/attribution` | 🔒 PROTECTED |
| `/admin/analytics/backlinks` | 🔒 PROTECTED |
| `/admin/analytics/chat` | 🔒 PROTECTED |
| `/admin/analytics/clicks` | 🔒 PROTECTED |
| `/admin/analytics/conversion` | 🔒 PROTECTED |
| `/admin/analytics/flow` | 🔒 PROTECTED |
| `/admin/analytics/forms` | 🔒 PROTECTED |
| `/admin/analytics/integrations` | 🔒 PROTECTED |
| `/admin/analytics/keywords` | 🔒 PROTECTED |
| `/admin/analytics/pages` | 🔒 PROTECTED |
| `/admin/analytics/performance` | 🔒 PROTECTED |
| `/admin/analytics/rankings` | 🔒 PROTECTED |
| `/admin/analytics/realtime` | 🔒 PROTECTED |
| `/admin/analytics/reports` | 🔒 PROTECTED |
| `/admin/analytics/seo` | 🔒 PROTECTED |
| `/admin/analytics/traffic` | 🔒 PROTECTED |
| `/admin/blog` | 🔒 PROTECTED |
| `/admin/blog/new` | 🔒 PROTECTED |
| `/admin/blog/[id]/edit` | 🔒 PROTECTED |
| `/admin/fleet` | 🔒 PROTECTED |
| `/admin/fleet/new` | 🔒 PROTECTED |
| `/admin/fleet/categories` | 🔒 PROTECTED |
| `/admin/fleet/locations` | 🔒 PROTECTED |
| `/admin/fleet/types` | 🔒 PROTECTED |
| `/admin/fleet/[id]/edit` | 🔒 PROTECTED |
| `/admin/locations` | 🔒 PROTECTED |
| `/admin/media` | 🔒 PROTECTED |
| `/admin/payments` | 🔒 PROTECTED |
| `/admin/seo` | 🔒 PROTECTED |
| `/admin/services` | 🔒 PROTECTED |
| `/admin/services-management` | 🔒 PROTECTED |
| `/admin/services/[slug]` | 🔒 PROTECTED |
| `/admin/services/[slug]/airport-transfers` | 🔒 PROTECTED |
| `/admin/services/[slug]/airports` | 🔒 PROTECTED |
| `/admin/services/[slug]/blog` | 🔒 PROTECTED |
| `/admin/services/[slug]/bookings` | 🔒 PROTECTED |
| `/admin/services/[slug]/bookings/[id]` | 🔒 PROTECTED |
| `/admin/services/[slug]/brands` | 🔒 PROTECTED |
| `/admin/services/[slug]/bulk-setup` | 🔒 PROTECTED |
| `/admin/services/[slug]/city-pricing` | 🔒 PROTECTED |
| `/admin/services/[slug]/coverage` | 🔒 PROTECTED |
| `/admin/services/[slug]/distances` | 🔒 PROTECTED |
| `/admin/services/[slug]/fleet` | 🔒 PROTECTED |
| `/admin/services/[slug]/fleet/[id]` | 🔒 PROTECTED |
| `/admin/services/[slug]/knowledge-base` | 🔒 PROTECTED |
| `/admin/services/[slug]/location-inventory` | 🔒 PROTECTED |
| `/admin/services/[slug]/locations` | 🔒 PROTECTED |
| `/admin/services/[slug]/media` | 🔒 PROTECTED |
| `/admin/services/[slug]/oneway` | 🔒 PROTECTED |
| `/admin/services/[slug]/packages` | 🔒 PROTECTED |
| `/admin/services/[slug]/page-content` | 🔒 PROTECTED |
| `/admin/services/[slug]/pages` | 🔒 PROTECTED |
| `/admin/services/[slug]/price-tester` | 🔒 PROTECTED |
| `/admin/services/[slug]/pricing` | 🔒 PROTECTED |
| `/admin/services/[slug]/redirects` | 🔒 PROTECTED |
| `/admin/services/[slug]/routes` | 🔒 PROTECTED |
| `/admin/services/[slug]/seo` | 🔒 PROTECTED |
| `/admin/services/[slug]/settings` | 🔒 PROTECTED |
| `/admin/services/[slug]/sub-services` | 🔒 PROTECTED |
| `/admin/services/[slug]/trip-types` | 🔒 PROTECTED |
| `/admin/services/[slug]/vehicle-models` | 🔒 PROTECTED |
| `/admin/services/[slug]/vehicles` | 🔒 PROTECTED |
| `/admin/settings` | 🔒 PROTECTED |
| `/admin/settings/bank-details` | 🔒 PROTECTED |
| `/admin/settings/fees` | 🔒 PROTECTED |
| `/admin/settings/managers` | 🔒 PROTECTED |
| `/admin/settings/payments` | 🔒 PROTECTED |
| `/admin/settings/tracking` | 🔒 PROTECTED |
| `/admin/users` | 🔒 PROTECTED |
| `/admin/vendors` | 🔒 PROTECTED |
| `/admin/vendors/pending` | 🔒 PROTECTED |
| `/admin/vendors/location-requests` | 🔒 PROTECTED |
| `/admin/vendors/service-requests` | 🔒 PROTECTED |
| `/admin/vendors/[id]` | 🔒 PROTECTED |
| `/admin/vendor-documents` | 🔒 PROTECTED |
| `/admin/helpdesk` | 🔒 PROTECTED |
| `/admin/helpdesk/[id]` | 🔒 PROTECTED |
| `/admin/helpdesk/inquiries/[id]` | 🔒 PROTECTED |
| `/admin/helpdesk/tickets` | 🔒 PROTECTED |
| `/admin/helpdesk/tickets/[id]` | 🔒 PROTECTED |
| `/admin/b2b` | 🔒 PROTECTED |
| `/admin/b2b/bookings` | 🔒 PROTECTED |
| `/admin/b2b/bookings/[id]` | 🔒 PROTECTED |
| `/admin/booking/brands` | 🔒 PROTECTED |
| `/admin/booking/local-packages` | 🔒 PROTECTED |
| `/admin/booking/services` | 🔒 PROTECTED |
| `/admin/booking/trip-types` | 🔒 PROTECTED |
| `/admin/booking/vehicle-models` | 🔒 PROTECTED |
| `/admin/wander` | 🔒 PROTECTED |
| `/admin/wander/categories` | 🔒 PROTECTED |
| `/admin/wander/experiences` | 🔒 PROTECTED |
| `/admin/wander/listings` | 🔒 PROTECTED |
| `/admin/wander/quotes` | 🔒 PROTECTED |
| `/admin/web-stories` | 🔒 PROTECTED |
| `/admin/web-stories/new` | 🔒 PROTECTED |
| `/admin/web-stories/[id]` | 🔒 PROTECTED |
| `/admin/web-stories/preview/[id]` | 🔒 PROTECTED |
| `/admin/website/appearance` | 🔒 PROTECTED |
| `/admin/website/city-pages` | 🔒 PROTECTED |
| `/admin/website/footer` | 🔒 PROTECTED |
| `/admin/website/homepage` | 🔒 PROTECTED |
| `/admin/website/navigation` | 🔒 PROTECTED |
| `/admin/website/static-pages` | 🔒 PROTECTED |
| `/admin/social/categories` | 🔒 PROTECTED |

---

## 19. MANAGER PORTAL

| URL | Type |
|-----|------|
| `/manager/login` | 🟢 STATIC |
| `/manager/dashboard` | 🔒 PROTECTED |
| `/manager/bookings` | 🔒 PROTECTED |
| `/manager/bookings/[id]` | 🔒 PROTECTED |
| `/manager/vendors` | 🔒 PROTECTED |
| `/manager/vendors/[id]` | 🔒 PROTECTED |
| `/manager/vendor-performance` | 🔒 PROTECTED |
| `/manager/vendor-performance/[vendorId]` | 🔒 PROTECTED |
| `/manager/locations` | 🔒 PROTECTED |
| `/manager/city-pricing` | 🔒 PROTECTED |
| `/manager/inquiries` | 🔒 PROTECTED |
| `/manager/inquiries/[id]` | 🔒 PROTECTED |
| `/manager/chats` | 🔒 PROTECTED |
| `/manager/chats/[id]` | 🔒 PROTECTED |
| `/manager/b2b` | 🔒 PROTECTED |
| `/manager/b2b/[id]` | 🔒 PROTECTED |
| `/manager/b2b-companies` | 🔒 PROTECTED |
| `/manager/helpdesk` | 🔒 PROTECTED |
| `/manager/helpdesk/inquiries/[id]` | 🔒 PROTECTED |
| `/manager/helpdesk/tickets/[id]` | 🔒 PROTECTED |

---

## 20. SUBADMIN PORTAL

| URL | Type |
|-----|------|
| `/subadmin/login` | 🟢 STATIC |
| `/subadmin/dashboard` | 🔒 PROTECTED |
| `/subadmin/users` | 🔒 PROTECTED |

---

## SUMMARY

| Category | Count |
|----------|-------|
| Public Static Pages | ~30 |
| City/State/CMS (catch-all) | 150+ cities + 28 states + CMS |
| Service Base Pages (static) | 55 |
| Service Location Pages (DB-Static + ISR) | 55 patterns × N locations |
| Route Pages (airport, one-way, round-trip) | N routes from DB |
| Blog / Stories / Wander | ~15 patterns |
| Booking / Payment / Track | ~8 patterns |
| Customer Portal | ~40 |
| Vendor Portal | ~180 |
| Driver Portal | ~22 |
| Admin Portal | ~100 |
| Manager Portal | ~20 |
| SubAdmin Portal | 3 |
| **Total page.tsx files** | **560** |

---

## DATABASE TABLES USED FOR PAGE GENERATION

| Table | Used By |
|-------|---------|
| `locations` | City pages, all service location pages |
| `service_locations` | Which service is active in which city |
| `chauffeur_route_packages` | Airport transfer, one-way-cab, round-trip pages |
| `pages` | CMS pages via catch-all `/[slug]` |
| `blog_posts` | Blog post pages |
| `blog_categories` | Blog category pages |
| `blog_tags` | Blog tag pages |
