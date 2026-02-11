/**
 * Seed Fleet Data
 * Populates fleet management tables with realistic test data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCategories() {
  console.log('\n📦 Seeding fleet categories...');

  const categories = [
    {
      id: 'cat_bikes',
      name: 'Bikes',
      slug: 'bikes',
      description: 'Two-wheeler motorcycles and scooters',
      icon: '🏍️',
      displayOrder: 1,
      isActive: true,
    },
    {
      id: 'cat_cars',
      name: 'Cars',
      slug: 'cars',
      description: 'Four-wheeler passenger vehicles',
      icon: '🚗',
      displayOrder: 2,
      isActive: true,
    },
    {
      id: 'cat_suvs',
      name: 'SUVs',
      slug: 'suvs',
      description: 'Sport Utility Vehicles',
      icon: '🚙',
      displayOrder: 3,
      isActive: true,
    },
    {
      id: 'cat_buses',
      name: 'Buses',
      slug: 'buses',
      description: 'Large passenger vehicles',
      icon: '🚌',
      displayOrder: 4,
      isActive: true,
    },
    {
      id: 'cat_trucks',
      name: 'Trucks',
      slug: 'trucks',
      description: 'Commercial cargo vehicles',
      icon: '🚚',
      displayOrder: 5,
      isActive: true,
    },
    {
      id: 'cat_luxury',
      name: 'Luxury',
      slug: 'luxury',
      description: 'Premium luxury vehicles',
      icon: '🏎️',
      displayOrder: 6,
      isActive: true,
    },
  ];

  await prisma.fleet_categories.createMany({ data: categories });
  console.log(`✅ Created ${categories.length} categories`);
}

async function seedLocations() {
  console.log('\n📍 Seeding fleet locations...');

  const locations = [
    { id: 'loc_mumbai', name: 'Mumbai', slug: 'mumbai', state: 'Maharashtra', stateCode: 'MH', tier: 1 },
    { id: 'loc_delhi', name: 'Delhi', slug: 'delhi', state: 'Delhi', stateCode: 'DL', tier: 1 },
    { id: 'loc_bangalore', name: 'Bangalore', slug: 'bangalore', state: 'Karnataka', stateCode: 'KA', tier: 1 },
    { id: 'loc_hyderabad', name: 'Hyderabad', slug: 'hyderabad', state: 'Telangana', stateCode: 'TG', tier: 1 },
    { id: 'loc_chennai', name: 'Chennai', slug: 'chennai', state: 'Tamil Nadu', stateCode: 'TN', tier: 1 },
    { id: 'loc_kolkata', name: 'Kolkata', slug: 'kolkata', state: 'West Bengal', stateCode: 'WB', tier: 1 },
    { id: 'loc_pune', name: 'Pune', slug: 'pune', state: 'Maharashtra', stateCode: 'MH', tier: 1 },
    { id: 'loc_ahmedabad', name: 'Ahmedabad', slug: 'ahmedabad', state: 'Gujarat', stateCode: 'GJ', tier: 2 },
    { id: 'loc_jaipur', name: 'Jaipur', slug: 'jaipur', state: 'Rajasthan', stateCode: 'RJ', tier: 2 },
    { id: 'loc_surat', name: 'Surat', slug: 'surat', state: 'Gujarat', stateCode: 'GJ', tier: 2 },
    { id: 'loc_lucknow', name: 'Lucknow', slug: 'lucknow', state: 'Uttar Pradesh', stateCode: 'UP', tier: 2 },
    { id: 'loc_kanpur', name: 'Kanpur', slug: 'kanpur', state: 'Uttar Pradesh', stateCode: 'UP', tier: 2 },
    { id: 'loc_nagpur', name: 'Nagpur', slug: 'nagpur', state: 'Maharashtra', stateCode: 'MH', tier: 2 },
    { id: 'loc_indore', name: 'Indore', slug: 'indore', state: 'Madhya Pradesh', stateCode: 'MP', tier: 2 },
    { id: 'loc_bhopal', name: 'Bhopal', slug: 'bhopal', state: 'Madhya Pradesh', stateCode: 'MP', tier: 2 },
  ];

  await prisma.fleet_locations.createMany({ data: locations });
  console.log(`✅ Created ${locations.length} locations`);
}

async function seedFleet() {
  console.log('\n🚗 Seeding fleet vehicles...');

  const vehicles = [
    // Bikes
    {
      id: 'fleet_activa',
      name: 'Honda Activa 6G',
      slug: 'honda-activa-6g',
      brand: 'Honda',
      categoryId: 'cat_bikes',
      vehicleType: 'Scooter',
      basePrice: 500,
      description: 'Popular and fuel-efficient scooter, perfect for city commuting',
      shortDesc: 'Fuel-efficient city scooter',
      isActive: true,
      isFeatured: true,
      priority: 1,
      viewCount: 245,
      bookingCount: 32,
    },
    {
      id: 'fleet_royal_enfield',
      name: 'Royal Enfield Classic 350',
      slug: 'royal-enfield-classic-350',
      brand: 'Royal Enfield',
      categoryId: 'cat_bikes',
      vehicleType: 'Motorcycle',
      basePrice: 1200,
      description: 'Iconic cruiser motorcycle for long rides',
      shortDesc: 'Classic cruiser motorcycle',
      isActive: true,
      isFeatured: true,
      priority: 2,
      viewCount: 189,
      bookingCount: 28,
    },
    {
      id: 'fleet_splendor',
      name: 'Hero Splendor Plus',
      slug: 'hero-splendor-plus',
      brand: 'Hero',
      categoryId: 'cat_bikes',
      vehicleType: 'Motorcycle',
      basePrice: 400,
      description: 'Affordable and reliable commuter bike',
      shortDesc: 'Budget-friendly commuter',
      isActive: true,
      priority: 3,
      viewCount: 156,
      bookingCount: 21,
    },

    // Cars
    {
      id: 'fleet_swift',
      name: 'Maruti Suzuki Swift',
      slug: 'maruti-suzuki-swift',
      brand: 'Maruti Suzuki',
      categoryId: 'cat_cars',
      vehicleType: 'Hatchback',
      basePrice: 2000,
      description: 'Sporty and fuel-efficient hatchback',
      shortDesc: 'Popular compact hatchback',
      isActive: true,
      isFeatured: true,
      priority: 1,
      viewCount: 312,
      bookingCount: 45,
    },
    {
      id: 'fleet_dzire',
      name: 'Maruti Suzuki Dzire',
      slug: 'maruti-suzuki-dzire',
      brand: 'Maruti Suzuki',
      categoryId: 'cat_cars',
      vehicleType: 'Sedan',
      basePrice: 2200,
      description: 'Comfortable sedan for family trips',
      shortDesc: 'Family-friendly sedan',
      isActive: true,
      isFeatured: true,
      priority: 2,
      viewCount: 298,
      bookingCount: 41,
    },
    {
      id: 'fleet_i20',
      name: 'Hyundai i20',
      slug: 'hyundai-i20',
      brand: 'Hyundai',
      categoryId: 'cat_cars',
      vehicleType: 'Hatchback',
      basePrice: 2100,
      description: 'Premium hatchback with modern features',
      shortDesc: 'Premium compact car',
      isActive: true,
      priority: 3,
      viewCount: 267,
      bookingCount: 38,
    },

    // SUVs
    {
      id: 'fleet_creta',
      name: 'Hyundai Creta',
      slug: 'hyundai-creta',
      brand: 'Hyundai',
      categoryId: 'cat_suvs',
      vehicleType: 'SUV',
      basePrice: 3500,
      description: 'Spacious and feature-rich SUV',
      shortDesc: 'Mid-size family SUV',
      isActive: true,
      isFeatured: true,
      priority: 1,
      viewCount: 421,
      bookingCount: 52,
    },
    {
      id: 'fleet_seltos',
      name: 'Kia Seltos',
      slug: 'kia-seltos',
      brand: 'Kia',
      categoryId: 'cat_suvs',
      vehicleType: 'SUV',
      basePrice: 3600,
      description: 'Bold and stylish compact SUV',
      shortDesc: 'Stylish compact SUV',
      isActive: true,
      isFeatured: true,
      priority: 2,
      viewCount: 389,
      bookingCount: 48,
    },
    {
      id: 'fleet_fortuner',
      name: 'Toyota Fortuner',
      slug: 'toyota-fortuner',
      brand: 'Toyota',
      categoryId: 'cat_suvs',
      vehicleType: 'SUV',
      basePrice: 6000,
      description: 'Premium full-size SUV for luxury travel',
      shortDesc: 'Premium large SUV',
      isActive: true,
      isFeatured: true,
      priority: 3,
      viewCount: 356,
      bookingCount: 35,
    },

    // Buses
    {
      id: 'fleet_tempo_traveller',
      name: 'Force Tempo Traveller 17-Seater',
      slug: 'force-tempo-traveller-17',
      brand: 'Force',
      categoryId: 'cat_buses',
      vehicleType: 'Mini Bus',
      basePrice: 4500,
      description: 'Comfortable 17-seater for group travel',
      shortDesc: '17-seater mini bus',
      isActive: true,
      isFeatured: true,
      priority: 1,
      viewCount: 234,
      bookingCount: 29,
    },
    {
      id: 'fleet_bus_45',
      name: '45-Seater Luxury Coach',
      slug: 'luxury-coach-45-seater',
      brand: 'Tata',
      categoryId: 'cat_buses',
      vehicleType: 'Bus',
      basePrice: 8000,
      description: 'Large luxury coach for events and tours',
      shortDesc: '45-seater luxury bus',
      isActive: true,
      priority: 2,
      viewCount: 178,
      bookingCount: 18,
    },

    // Trucks
    {
      id: 'fleet_tata_ace',
      name: 'Tata Ace',
      slug: 'tata-ace',
      brand: 'Tata',
      categoryId: 'cat_trucks',
      vehicleType: 'Mini Truck',
      basePrice: 1500,
      description: 'Compact mini truck for city logistics',
      shortDesc: 'Compact goods carrier',
      isActive: true,
      priority: 1,
      viewCount: 145,
      bookingCount: 22,
    },
    {
      id: 'fleet_mahindra_bolero',
      name: 'Mahindra Bolero Pickup',
      slug: 'mahindra-bolero-pickup',
      brand: 'Mahindra',
      categoryId: 'cat_trucks',
      vehicleType: 'Pickup',
      basePrice: 2500,
      description: 'Reliable pickup truck for cargo',
      shortDesc: 'Pickup truck',
      isActive: true,
      priority: 2,
      viewCount: 123,
      bookingCount: 16,
    },

    // Luxury
    {
      id: 'fleet_mercedes_e',
      name: 'Mercedes-Benz E-Class',
      slug: 'mercedes-benz-e-class',
      brand: 'Mercedes-Benz',
      categoryId: 'cat_luxury',
      vehicleType: 'Sedan',
      basePrice: 8500,
      description: 'Luxury executive sedan with premium comfort',
      shortDesc: 'Luxury executive sedan',
      isActive: true,
      isFeatured: true,
      priority: 1,
      viewCount: 278,
      bookingCount: 19,
    },
    {
      id: 'fleet_bmw_5',
      name: 'BMW 5 Series',
      slug: 'bmw-5-series',
      brand: 'BMW',
      categoryId: 'cat_luxury',
      vehicleType: 'Sedan',
      basePrice: 9000,
      description: 'Premium German sedan with cutting-edge technology',
      shortDesc: 'Premium luxury sedan',
      isActive: true,
      isFeatured: true,
      priority: 2,
      viewCount: 256,
      bookingCount: 17,
    },
  ];

  await prisma.fleet.createMany({ data: vehicles });
  console.log(`✅ Created ${vehicles.length} vehicles`);
}

async function main() {
  console.log('🚀 Starting fleet data seeding...\n');

  try {
    await seedCategories();
    await seedLocations();
    await seedFleet();

    console.log('\n✅ Fleet data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - 6 fleet categories');
    console.log('   - 15 locations');
    console.log('   - 15 vehicles');
    console.log('\n🔗 View your dashboard at: http://localhost:3000/admin/dashboard');
  } catch (error) {
    console.error('❌ Error seeding fleet data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
