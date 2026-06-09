export interface AmenityItem {
  id: string;
  label: string;
}

export interface AmenityGroup {
  id: string;
  label: string;
  items: AmenityItem[];
}

export const AMENITY_GROUPS: AmenityGroup[] = [
  {
    id: 'essentials',
    label: 'Essentials',
    items: [
      { id: 'wifi', label: 'Free WiFi' },
      { id: 'ac', label: 'Air Conditioning' },
      { id: 'heating', label: 'Heating' },
      { id: 'hot_water', label: 'Hot Water' },
      { id: 'tv', label: 'Television' },
      { id: 'washer', label: 'Washing Machine' },
      { id: 'iron', label: 'Iron & Board' },
      { id: 'hair_dryer', label: 'Hair Dryer' },
    ],
  },
  {
    id: 'facilities',
    label: 'Facilities',
    items: [
      { id: 'pool', label: 'Swimming Pool' },
      { id: 'gym', label: 'Gym / Fitness Center' },
      { id: 'restaurant', label: 'Restaurant' },
      { id: 'spa', label: 'Spa & Wellness' },
      { id: 'rooftop', label: 'Rooftop' },
      { id: 'garden', label: 'Garden / Lawn' },
      { id: 'conference_room', label: 'Conference Room' },
      { id: 'lounge', label: 'Lounge Area' },
    ],
  },
  {
    id: 'parking',
    label: 'Parking & Access',
    items: [
      { id: 'free_parking', label: 'Free Parking' },
      { id: 'paid_parking', label: 'Paid Parking' },
      { id: 'elevator', label: 'Elevator / Lift' },
      { id: 'wheelchair', label: 'Wheelchair Accessible' },
      { id: '24h_checkin', label: '24/7 Check-in' },
      { id: 'ev_charger', label: 'EV Charging Point' },
    ],
  },
  {
    id: 'safety',
    label: 'Safety & Security',
    items: [
      { id: 'cctv', label: 'CCTV Surveillance' },
      { id: 'fire_extinguisher', label: 'Fire Extinguisher' },
      { id: 'first_aid', label: 'First Aid Kit' },
      { id: 'security_guard', label: 'Security Guard' },
      { id: 'smoke_alarm', label: 'Smoke Alarm' },
      { id: 'safe_locker', label: 'In-room Safe Locker' },
    ],
  },
  {
    id: 'food',
    label: 'Food & Kitchen',
    items: [
      { id: 'breakfast', label: 'Breakfast Available' },
      { id: 'all_meals', label: 'All Meals Available' },
      { id: 'minibar', label: 'Minibar' },
      { id: 'coffee_tea', label: 'Tea / Coffee Maker' },
      { id: 'microwave', label: 'Microwave' },
      { id: 'fridge', label: 'Refrigerator' },
      { id: 'kitchen', label: 'Shared Kitchen' },
    ],
  },
  {
    id: 'outdoor',
    label: 'Outdoor & Recreation',
    items: [
      { id: 'bonfire', label: 'Bonfire Area' },
      { id: 'bbq', label: 'BBQ / Grill' },
      { id: 'adventure', label: 'Adventure Activities' },
      { id: 'kids_play', label: "Children's Play Area" },
      { id: 'cycling', label: 'Cycling' },
      { id: 'beach_access', label: 'Beach Access' },
    ],
  },
];

export const AMENITY_LABEL_MAP: Record<string, string> = Object.fromEntries(
  AMENITY_GROUPS.flatMap((g) => g.items.map((i) => [i.id, i.label])),
);

export function parseAmenities(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string');
  } catch {
    // legacy plain text — return empty (can't map to structured IDs)
  }
  return [];
}

export const CANCELLATION_POLICIES = [
  {
    value: 'FLEXIBLE',
    label: 'Flexible',
    description: 'Free cancellation up to 24 hours before check-in',
  },
  {
    value: 'MODERATE',
    label: 'Moderate',
    description: 'Free cancellation up to 5 days before check-in',
  },
  {
    value: 'STRICT',
    label: 'Strict',
    description: '50% refund if cancelled 7+ days before check-in',
  },
  {
    value: 'NON_REFUNDABLE',
    label: 'Non-Refundable',
    description: 'No refunds on cancellation',
  },
];
