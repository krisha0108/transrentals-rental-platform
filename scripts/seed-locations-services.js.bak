const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Locations and Services Seed File
 *
 * Extracted from tr-new database on 2026-01-21T08:35:00.655Z
 *
 * Usage: node scripts/seed-locations-services.js
 */

// ============================================
// SERVICES DATA (10 total)
// ============================================

// Parent Services (8)
const PARENT_SERVICES = [
  { id: 'SVC_1', name: 'Bike Rental', slug: 'bike-on-rent', parentId: null, description: 'Bike Rental ', shortDesc: 'Bike Rental', icon: null, image: null, flowType: 'BROWSE_FIRST', config: null, formFields: null, isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'SVC_2', name: 'Self Drive Car Rental', slug: 'self-drive-car-rentals', parentId: null, description: 'Self Drive', shortDesc: 'Self Drive', icon: null, image: null, flowType: 'BROWSE_FIRST', config: null, formFields: null, isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'SVC_3', name: 'Bus Rental', slug: 'bus-rental', parentId: null, description: null, shortDesc: null, icon: null, image: null, flowType: 'QUOTE_BASED', config: null, formFields: null, isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'SVC_4', name: 'Truck Rental', slug: 'transporter', parentId: null, description: null, shortDesc: null, icon: null, image: null, flowType: 'BROWSE_FIRST', config: null, formFields: null, isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'SVC_5', name: 'Car Rental', slug: 'car-rental', parentId: null, description: null, shortDesc: 'Car Rental', icon: null, image: null, flowType: 'TRIP_FIRST', config: null, formFields: null, isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'SVC_6', name: 'Packers and Movers', slug: 'packers-and-movers', parentId: null, description: null, shortDesc: 'Packers & Movers', icon: null, image: null, flowType: 'QUOTE_BASED', config: null, formFields: null, isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'SVC_7', name: 'Equipment Rental', slug: 'equipment-rental', parentId: null, description: null, shortDesc: 'Equipment Rental', icon: null, image: null, flowType: 'QUOTE_BASED', config: null, formFields: null, isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'SVC_8', name: 'Luxury Car', slug: 'luxury-car-rental', parentId: null, description: null, shortDesc: 'Luxury Car Rental', icon: null, image: null, flowType: 'QUOTE_BASED', config: null, formFields: null, isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
];

// Child/Sub Services (2)
const CHILD_SERVICES = [
  { id: 'SVC_9', name: 'Activa', slug: 'bike-rental-activa', parentId: 'SVC_1', description: null, shortDesc: null, icon: null, image: null, flowType: 'BROWSE_FIRST', config: null, formFields: null, isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'SVC_10', name: 'Hatchback', slug: 'self-drive-car-rental-hatchback', parentId: 'SVC_2', description: null, shortDesc: null, icon: null, image: null, flowType: 'BROWSE_FIRST', config: null, formFields: null, isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
];

// ============================================
// LOCATIONS DATA (570 total)
// ============================================

// Countries (1)
const COUNTRIES = [
  { id: 'LOC_1', name: 'India', slug: 'india', type: 'COUNTRY', parentId: null, code: null, image: 'locations/eNOjSsLF5Nao8dZE3EwNfK4kJgJ9ItKyntnRxPAL.jpg', description: null, latitude: 22.3511148, longitude: 78.6677428, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
];

// States (37)
const STATES = [
  { id: 'LOC_2', name: 'Andhra Pradesh', slug: 'andhra-pradesh', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_3', name: 'Arunachal Pradesh', slug: 'arunachal-pradesh', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_4', name: 'Assam', slug: 'assam', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_5', name: 'Bihar', slug: 'bihar', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_6', name: 'Chhattisgarh', slug: 'chhattisgarh', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_7', name: 'Gujarat', slug: 'gujarat', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_8', name: 'Haryana', slug: 'haryana', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_9', name: 'Himachal Pradesh', slug: 'himachal-pradesh', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_10', name: 'Jharkhand', slug: 'jharkhand', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_11', name: 'Karnataka', slug: 'karnataka', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_12', name: 'Kerala', slug: 'kerala', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_13', name: 'Madhya Pradesh', slug: 'madhya-pradesh', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_14', name: 'Maharastra', slug: 'maharastra', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_15', name: 'Manipur', slug: 'manipur', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_16', name: 'Meghalaya', slug: 'meghalaya', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_17', name: 'Mizoram', slug: 'mizoram', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_18', name: 'Nagaland', slug: 'nagaland', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_20', name: 'Odisha', slug: 'odisha', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_21', name: 'Punjab', slug: 'punjab', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_22', name: 'Rajasthan', slug: 'rajasthan', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_23', name: 'Sikkim', slug: 'sikkim', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_24', name: 'Tamil Nadu', slug: 'tamil-nadu', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_25', name: 'Telangana', slug: 'telangana', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_26', name: 'Tripura', slug: 'tripura', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_27', name: 'Uttar Pradesh', slug: 'uttar-pradesh', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_28', name: 'Uttarakhand', slug: 'uttarakhand', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_29', name: 'West Bengal', slug: 'west-bengal', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_55', name: 'Andaman and Nicobar Islands', slug: 'andaman-and-nicobar-islands', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_120', name: 'Chandigarh', slug: 'chandigarh', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_138', name: 'Dadra and Nagar Haveli', slug: 'dadra-and-nagar-haveli', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_140', name: 'Daman and Diu', slug: 'daman-and-diu', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_150', name: 'Delhi', slug: 'delhi', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_184', name: 'Goa', slug: 'goa', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_228', name: 'Jammu and Kashmir', slug: 'jammu-and-kashmir', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_292', name: 'Ladakh', slug: 'ladakh', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_293', name: 'Lakshadweep', slug: 'lakshadweep', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_391', name: 'Puducherry', slug: 'puducherry', type: 'STATE', parentId: 'LOC_1', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
];

// Cities (531)
const CITIES = [
  { id: 'LOC_19', name: 'Nayagarh', slug: 'nayagarh', type: 'CITY', parentId: 'LOC_20', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_30', name: 'Achalpur', slug: 'achalpur', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 21.2407925, longitude: 77.427797, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_31', name: 'Adilabad', slug: 'adilabad', type: 'CITY', parentId: 'LOC_25', code: null, image: null, description: null, latitude: 19.6759452, longitude: 78.5339895, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_32', name: 'Adoni', slug: 'adoni', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 39.913451, longitude: 9.185837, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_33', name: 'Agartala', slug: 'agartala', type: 'CITY', parentId: 'LOC_26', code: null, image: null, description: null, latitude: 23.8312377, longitude: 91.2823821, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_34', name: 'Agra', slug: 'agra', type: 'CITY', parentId: 'LOC_27', code: null, image: null, description: null, latitude: 27.1752554, longitude: 78.0098161, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_35', name: 'Ahmedabad', slug: 'ahmedabad', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 23.0215374, longitude: 72.5800568, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_36', name: 'Ahmednagar', slug: 'ahmednagar', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 19.1627725, longitude: 74.8580243, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_37', name: 'Aizawl', slug: 'aizawl', type: 'CITY', parentId: 'LOC_17', code: null, image: null, description: null, latitude: 23.7433532, longitude: 92.7382756, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_38', name: 'Ajmer', slug: 'ajmer', type: 'CITY', parentId: 'LOC_22', code: null, image: null, description: null, latitude: 26.4691, longitude: 74.639, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_39', name: 'Akola', slug: 'akola', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 20.7618123, longitude: 77.1921157, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_40', name: 'Aligarh', slug: 'aligarh', type: 'CITY', parentId: 'LOC_27', code: null, image: null, description: null, latitude: 27.8761073, longitude: 78.1358153, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_41', name: 'Alipurduar', slug: 'alipurduar', type: 'CITY', parentId: 'LOC_29', code: null, image: null, description: null, latitude: 26.4851573, longitude: 89.5246926, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_42', name: 'Almora', slug: 'almora', type: 'CITY', parentId: 'LOC_28', code: null, image: null, description: null, latitude: 29.702651, longitude: 79.4326318, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_43', name: 'Along', slug: 'along', type: 'CITY', parentId: 'LOC_3', code: null, image: null, description: null, latitude: 6.9011878, longitude: 158.1131663, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_44', name: 'Alwar', slug: 'alwar', type: 'CITY', parentId: 'LOC_22', code: null, image: null, description: null, latitude: 27.4140048, longitude: 76.6170387, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_45', name: 'Amarpur', slug: 'amarpur', type: 'CITY', parentId: 'LOC_26', code: null, image: null, description: null, latitude: 23.5155013, longitude: 91.6548554, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_46', name: 'Ambala', slug: 'ambala', type: 'CITY', parentId: 'LOC_8', code: null, image: null, description: null, latitude: 30.3843674, longitude: 76.770421, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_47', name: 'Ambarnath', slug: 'ambarnath', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 19.2015607, longitude: 73.2004771, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_48', name: 'Ambassa', slug: 'ambassa', type: 'CITY', parentId: 'LOC_26', code: null, image: null, description: null, latitude: 23.8879384, longitude: 91.864423, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_49', name: 'Ambikapur', slug: 'ambikapur', type: 'CITY', parentId: 'LOC_6', code: null, image: null, description: null, latitude: 23.1226343, longitude: 83.1981886, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_50', name: 'Amravati', slug: 'amravati', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 21.1545412, longitude: 77.6442962, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_51', name: 'Amreli', slug: 'amreli', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 21.4176122, longitude: 71.249609, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_52', name: 'Amritsar', slug: 'amritsar', type: 'CITY', parentId: 'LOC_21', code: null, image: null, description: null, latitude: 31.6356659, longitude: 74.8787496, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_53', name: 'Anand', slug: 'anand', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 22.5586555, longitude: 72.9627227, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_54', name: 'Anantapur', slug: 'anantapur', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 14.72422, longitude: 77.4306738, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_56', name: 'Andro', slug: 'andro', type: 'CITY', parentId: 'LOC_15', code: null, image: null, description: null, latitude: 24.7547931, longitude: 94.0467274, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_57', name: 'Angul', slug: 'angul', type: 'CITY', parentId: 'LOC_20', code: null, image: null, description: null, latitude: 21.102538, longitude: 84.9536825, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_58', name: 'Anini', slug: 'anini', type: 'CITY', parentId: 'LOC_3', code: null, image: null, description: null, latitude: 45.35234, longitude: 26.4745645, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_59', name: 'Ankola', slug: 'ankola', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: -11.8775768, longitude: 17.5691241, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_60', name: 'Asansol', slug: 'asansol', type: 'CITY', parentId: 'LOC_29', code: null, image: null, description: null, latitude: 23.6871297, longitude: 86.9746587, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_61', name: 'Aurangabad', slug: 'aurangabad', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 24.8033201, longitude: 84.4110198, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_62', name: 'Ayodhya', slug: 'ayodhya', type: 'CITY', parentId: 'LOC_27', code: null, image: null, description: null, latitude: 26.7990707, longitude: 82.2052321, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_63', name: 'Azamgarh', slug: 'azamgarh', type: 'CITY', parentId: 'LOC_27', code: null, image: null, description: null, latitude: 26.023639, longitude: 83.0293105, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_64', name: 'Badlapur', slug: 'badlapur', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 19.1666237, longitude: 73.2389064, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_65', name: 'Bagalkot', slug: 'bagalkot', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 16.1793224, longitude: 75.6999315, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_66', name: 'Bageshwar', slug: 'bageshwar', type: 'CITY', parentId: 'LOC_28', code: null, image: null, description: null, latitude: 30.0087902, longitude: 79.9280183, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_67', name: 'Bahadurgarh', slug: 'bahadurgarh', type: 'CITY', parentId: 'LOC_8', code: null, image: null, description: null, latitude: 28.6609648, longitude: 76.8346765, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_68', name: 'Baharampur', slug: 'baharampur', type: 'CITY', parentId: 'LOC_29', code: null, image: null, description: null, latitude: 24.1044927, longitude: 88.2510635, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_69', name: 'Balangir', slug: 'balangir', type: 'CITY', parentId: 'LOC_20', code: null, image: null, description: null, latitude: 20.6095183, longitude: 83.1673029, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_70', name: 'Balasore', slug: 'balasore', type: 'CITY', parentId: 'LOC_20', code: null, image: null, description: null, latitude: 21.5006421, longitude: 86.919884, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_71', name: 'Banaskantha', slug: 'banaskantha', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 24.2693921, longitude: 72.1620246, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_72', name: 'Bangalore', slug: 'bangalore', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 12.9881568, longitude: 77.6226, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_73', name: 'Baran', slug: 'baran', type: 'CITY', parentId: 'LOC_22', code: null, image: null, description: null, latitude: 24.9208165, longitude: 76.6821985, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_74', name: 'Bardhaman', slug: 'bardhaman', type: 'CITY', parentId: 'LOC_29', code: null, image: null, description: null, latitude: 23.2495714, longitude: 87.8681751, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_75', name: 'Bareilly', slug: 'bareilly', type: 'CITY', parentId: 'LOC_27', code: null, image: null, description: null, latitude: 28.4582345, longitude: 79.4047452, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_76', name: 'Baripada', slug: 'baripada', type: 'CITY', parentId: 'LOC_20', code: null, image: null, description: null, latitude: 21.9342456, longitude: 86.7308825, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_77', name: 'Barshi', slug: 'barshi', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 18.2341108, longitude: 75.6875109, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_78', name: 'Bathinda', slug: 'bathinda', type: 'CITY', parentId: 'LOC_21', code: null, image: null, description: null, latitude: 30.1794814, longitude: 75.0471098, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_79', name: 'Beawar', slug: 'beawar', type: 'CITY', parentId: 'LOC_22', code: null, image: null, description: null, latitude: 26.0992137, longitude: 74.3127044, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_80', name: 'Belgaum', slug: 'belgaum', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 15.8572666, longitude: 74.5069343, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_81', name: 'Bellary', slug: 'bellary', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 15.1433952, longitude: 76.9193876, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_82', name: 'Belonia', slug: 'belonia', type: 'CITY', parentId: 'LOC_26', code: null, image: null, description: null, latitude: 23.2497879, longitude: 91.4550309, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_83', name: 'Berhampur', slug: 'berhampur', type: 'CITY', parentId: 'LOC_20', code: null, image: null, description: null, latitude: 21.4930852, longitude: 86.6327298, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_84', name: 'Betul', slug: 'betul', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 21.8797472, longitude: 77.8753651, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_85', name: 'Bhadrak', slug: 'bhadrak', type: 'CITY', parentId: 'LOC_20', code: null, image: null, description: null, latitude: 20.9854052, longitude: 86.5934226, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_86', name: 'Bhagalpur', slug: 'bhagalpur', type: 'CITY', parentId: 'LOC_5', code: null, image: null, description: null, latitude: 25.2861354, longitude: 87.1304229, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_87', name: 'Bharatpur', slug: 'bharatpur', type: 'CITY', parentId: 'LOC_22', code: null, image: null, description: null, latitude: 27.0246959, longitude: 77.2920116, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_88', name: 'Bharuch', slug: 'bharuch', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 21.7080427, longitude: 72.9956936, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_89', name: 'Bhavnagar', slug: 'bhavnagar', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 21.7718836, longitude: 72.1416449, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_90', name: 'Bhawanipatna', slug: 'bhawanipatna', type: 'CITY', parentId: 'LOC_20', code: null, image: null, description: null, latitude: 19.9104952, longitude: 83.1678321, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_91', name: 'Bhilai', slug: 'bhilai', type: 'CITY', parentId: 'LOC_6', code: null, image: null, description: null, latitude: 21.2120677, longitude: 81.3732849, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_92', name: 'Bhilwara', slug: 'bhilwara', type: 'CITY', parentId: 'LOC_22', code: null, image: null, description: null, latitude: 25.4891177, longitude: 74.3300726, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_93', name: 'Bhimavaram', slug: 'bhimavaram', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 16.5427689, longitude: 81.527344, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_94', name: 'Bhind', slug: 'bhind', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 26.3518828, longitude: 78.6863189, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_95', name: 'Bhiwadi', slug: 'bhiwadi', type: 'CITY', parentId: 'LOC_22', code: null, image: null, description: null, latitude: 28.2039413, longitude: 76.837441, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_96', name: 'Bhiwandi', slug: 'bhiwandi', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 19.3025562, longitude: 73.0588072, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_97', name: 'Bhiwandi-Nizampur', slug: 'bhiwandi-nizampur', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 19.294067, longitude: 73.0664476, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_98', name: 'Bhiwani', slug: 'bhiwani', type: 'CITY', parentId: 'LOC_8', code: null, image: null, description: null, latitude: 28.7931703, longitude: 76.1391283, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_99', name: 'Bhopal', slug: 'bhopal', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 23.2584857, longitude: 77.401989, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_100', name: 'Bhubaneswar', slug: 'bhubaneswar', type: 'CITY', parentId: 'LOC_20', code: null, image: null, description: null, latitude: 20.2602964, longitude: 85.8394521, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_101', name: 'Bhuj', slug: 'bhuj', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 23.2472446, longitude: 69.668339, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_102', name: 'Bhusawal', slug: 'bhusawal', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 21.04572, longitude: 75.7808079, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_103', name: 'Bijapur', slug: 'bijapur-karnataka', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 18.7935679, longitude: 80.815939, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_104', name: 'Bijapur', slug: 'bijapur-chhattisgarh', type: 'CITY', parentId: 'LOC_6', code: null, image: null, description: null, latitude: 18.7935679, longitude: 80.815939, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_105', name: 'Bikaner', slug: 'bikaner', type: 'CITY', parentId: 'LOC_22', code: null, image: null, description: null, latitude: 28.0159286, longitude: 73.3171367, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_106', name: 'Bilaspur', slug: 'bilaspur-chhattisgarh', type: 'CITY', parentId: 'LOC_6', code: null, image: null, description: null, latitude: 22.1638486, longitude: 82.1365923, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_107', name: 'Bilaspur', slug: 'bilaspur-himachal', type: 'CITY', parentId: 'LOC_9', code: null, image: null, description: null, latitude: 22.1638486, longitude: 82.1365923, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_108', name: 'Bishalgarh', slug: 'bishalgarh', type: 'CITY', parentId: 'LOC_26', code: null, image: null, description: null, latitude: 23.6605579, longitude: 91.2892827, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_109', name: 'Bishnupur', slug: 'bishnupur', type: 'CITY', parentId: 'LOC_15', code: null, image: null, description: null, latitude: 23.0757335, longitude: 87.3146343, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_110', name: 'Bokaro', slug: 'bokaro', type: 'CITY', parentId: 'LOC_10', code: null, image: null, description: null, latitude: 23.6991279, longitude: 85.9910689, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_111', name: 'Bomdila', slug: 'bomdila', type: 'CITY', parentId: 'LOC_3', code: null, image: null, description: null, latitude: 27.264445, longitude: 92.4206519, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_112', name: 'Bongaigaon', slug: 'bongaigaon', type: 'CITY', parentId: 'LOC_4', code: null, image: null, description: null, latitude: 26.4800126, longitude: 90.5580387, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_113', name: 'Botad', slug: 'botad', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 22.0467097, longitude: 71.6689617, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_114', name: 'Bundi', slug: 'bundi', type: 'CITY', parentId: 'LOC_22', code: null, image: null, description: null, latitude: 25.4367659, longitude: 75.7361471, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_115', name: 'Burhanpur', slug: 'burhanpur', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 21.334867, longitude: 76.3708803, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_116', name: 'Chaibasa', slug: 'chaibasa', type: 'CITY', parentId: 'LOC_10', code: null, image: null, description: null, latitude: 22.5483518, longitude: 85.8188876, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_117', name: 'Chamba', slug: 'chamba', type: 'CITY', parentId: 'LOC_9', code: null, image: null, description: null, latitude: 32.6923316, longitude: 76.1631552, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_118', name: 'Champawat', slug: 'champawat', type: 'CITY', parentId: 'LOC_28', code: null, image: null, description: null, latitude: 29.235032, longitude: 80.1023068, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_119', name: 'Champhai', slug: 'champhai', type: 'CITY', parentId: 'LOC_17', code: null, image: null, description: null, latitude: 23.5443744, longitude: 93.3479506, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_121', name: 'Chandrapur', slug: 'chandrapur', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 20.0967555, longitude: 79.5045475, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_122', name: 'Changlang', slug: 'changlang', type: 'CITY', parentId: 'LOC_3', code: null, image: null, description: null, latitude: 27.272007, longitude: 96.065526, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_123', name: 'Charkhi Dadri', slug: 'charkhi-dadri', type: 'CITY', parentId: 'LOC_8', code: null, image: null, description: null, latitude: 28.5919933, longitude: 76.2719817, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_124', name: 'Chennai', slug: 'chennai', type: 'CITY', parentId: 'LOC_24', code: null, image: null, description: null, latitude: 13.0836939, longitude: 80.270186, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_125', name: 'Chhatarpur', slug: 'chhatarpur', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 24.7606089, longitude: 79.6781776, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_126', name: 'Chhindwara', slug: 'chhindwara', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 22.2071897, longitude: 78.798833, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_127', name: 'Chhota Udaipur', slug: 'chhota-udaipur', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 22.2224345, longitude: 73.7778749, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_128', name: 'Chikkaballapur', slug: 'chikkaballapur', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 13.0993764, longitude: 77.388729, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_129', name: 'Chikmagalur', slug: 'chikmagalur', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 13.318014, longitude: 75.7738743, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_130', name: 'Chilakaluripet', slug: 'chilakaluripet', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 16.0949502, longitude: 80.1658779, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_131', name: 'Chirmiri', slug: 'chirmiri', type: 'CITY', parentId: 'LOC_6', code: null, image: null, description: null, latitude: 23.1898407, longitude: 82.3498026, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_132', name: 'Chitradurga', slug: 'chitradurga', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 14.3049174, longitude: 76.5297234, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_133', name: 'Chittoor', slug: 'chittoor', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 13.2026484, longitude: 79.0032253, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_134', name: 'Churachandpur', slug: 'churachandpur', type: 'CITY', parentId: 'LOC_15', code: null, image: null, description: null, latitude: 24.2813108, longitude: 93.6760386, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_135', name: 'Coimbatore', slug: 'coimbatore', type: 'CITY', parentId: 'LOC_24', code: null, image: null, description: null, latitude: 11.0018115, longitude: 76.9628425, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_136', name: 'Cooch Behar', slug: 'cooch-behar', type: 'CITY', parentId: 'LOC_29', code: null, image: null, description: null, latitude: 26.2559197, longitude: 89.4201143, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_137', name: 'Cuttack', slug: 'cuttack', type: 'CITY', parentId: 'LOC_20', code: null, image: null, description: null, latitude: 20.4686, longitude: 85.8792, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_139', name: 'Dalhousie', slug: 'dalhousie', type: 'CITY', parentId: 'LOC_9', code: null, image: null, description: null, latitude: 48.0634448, longitude: -66.369555, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_141', name: 'Damoh', slug: 'damoh', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 23.7981005, longitude: 79.5419356, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_142', name: 'Dantewada', slug: 'dantewada', type: 'CITY', parentId: 'LOC_6', code: null, image: null, description: null, latitude: 18.8640648, longitude: 81.3833947, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_143', name: 'Daporijo', slug: 'daporijo', type: 'CITY', parentId: 'LOC_3', code: null, image: null, description: null, latitude: 27.9843402, longitude: 94.2190544, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_144', name: 'Darbhanga', slug: 'darbhanga', type: 'CITY', parentId: 'LOC_5', code: null, image: null, description: null, latitude: 26.0829899, longitude: 86.0324951, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_145', name: 'Darjeeling', slug: 'darjeeling', type: 'CITY', parentId: 'LOC_29', code: null, image: null, description: null, latitude: 27.0377554, longitude: 88.263176, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_146', name: 'Datia', slug: 'datia', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 25.9182947, longitude: 78.6644962, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_147', name: 'Davanagere', slug: 'davanagere', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 14.2558835, longitude: 75.8303421, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_148', name: 'Deesa', slug: 'deesa', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 24.2594977, longitude: 72.1803348, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_149', name: 'Dehradun', slug: 'dehradun', type: 'CITY', parentId: 'LOC_28', code: null, image: null, description: null, latitude: 30.3255646, longitude: 78.0436813, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_152', name: 'Deoghar', slug: 'deoghar', type: 'CITY', parentId: 'LOC_10', code: null, image: null, description: null, latitude: 24.4898318, longitude: 86.6990182, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_153', name: 'Dewas', slug: 'dewas', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 22.8057498, longitude: 76.2940408, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_154', name: 'Dhamtari', slug: 'dhamtari', type: 'CITY', parentId: 'LOC_6', code: null, image: null, description: null, latitude: 20.5326259, longitude: 81.7155987, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_155', name: 'Dhanbad', slug: 'dhanbad', type: 'CITY', parentId: 'LOC_10', code: null, image: null, description: null, latitude: 23.7952809, longitude: 86.4309638, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_156', name: 'Dharamshala', slug: 'dharamshala', type: 'CITY', parentId: 'LOC_9', code: null, image: null, description: null, latitude: 32.2143039, longitude: 76.3196717, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_157', name: 'Dharchula', slug: 'dharchula', type: 'CITY', parentId: 'LOC_28', code: null, image: null, description: null, latitude: 29.8491135, longitude: 80.5414711, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_158', name: 'Dharmanagar', slug: 'dharmanagar', type: 'CITY', parentId: 'LOC_26', code: null, image: null, description: null, latitude: 24.369978, longitude: 92.1699319, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_159', name: 'Dharmavaram', slug: 'dharmavaram', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 14.4138405, longitude: 77.7208432, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_160', name: 'Dharwad', slug: 'dharwad', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 15.3707296, longitude: 75.1332867, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_161', name: 'Dhenkanal', slug: 'dhenkanal', type: 'CITY', parentId: 'LOC_20', code: null, image: null, description: null, latitude: 20.8351494, longitude: 85.6022305, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_162', name: 'Dhule', slug: 'dhule', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 21.1305215, longitude: 74.4900614, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_163', name: 'Dibrugarh', slug: 'dibrugarh', type: 'CITY', parentId: 'LOC_4', code: null, image: null, description: null, latitude: 27.4844597, longitude: 94.9019447, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_164', name: 'Dimapur', slug: 'dimapur', type: 'CITY', parentId: 'LOC_18', code: null, image: null, description: null, latitude: 25.9041378, longitude: 93.7177609, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_165', name: 'Dindigul', slug: 'dindigul', type: 'CITY', parentId: 'LOC_24', code: null, image: null, description: null, latitude: 10.4256896, longitude: 77.815664, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_166', name: 'Dumka', slug: 'dumka', type: 'CITY', parentId: 'LOC_10', code: null, image: null, description: null, latitude: 24.2677937, longitude: 87.2485495, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_167', name: 'Durg', slug: 'durg', type: 'CITY', parentId: 'LOC_6', code: null, image: null, description: null, latitude: 21.1982964, longitude: 81.4007922, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_168', name: 'Durgapur', slug: 'durgapur', type: 'CITY', parentId: 'LOC_29', code: null, image: null, description: null, latitude: 23.5350475, longitude: 87.3380425, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_169', name: 'Eluru', slug: 'eluru', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 16.7104257, longitude: 81.1153816, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_170', name: 'Erode', slug: 'erode', type: 'CITY', parentId: 'LOC_24', code: null, image: null, description: null, latitude: 11.4905282, longitude: 77.3505274, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_171', name: 'Faizabad', slug: 'faizabad', type: 'CITY', parentId: 'LOC_27', code: null, image: null, description: null, latitude: 26.7807986, longitude: 82.1486589, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_172', name: 'Faridabad', slug: 'faridabad', type: 'CITY', parentId: 'LOC_8', code: null, image: null, description: null, latitude: 28.4031478, longitude: 77.3105561, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_173', name: 'Fatehabad', slug: 'fatehabad', type: 'CITY', parentId: 'LOC_8', code: null, image: null, description: null, latitude: 29.5359209, longitude: 75.5752901, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_174', name: 'Gadag', slug: 'gadag', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 15.416692, longitude: 75.6815801, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_175', name: 'Gairsain', slug: 'gairsain', type: 'CITY', parentId: 'LOC_28', code: null, image: null, description: null, latitude: 30.0546199, longitude: 79.2899889, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_176', name: 'Gandhidham', slug: 'gandhidham', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 23.0718743, longitude: 70.131715, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_177', name: 'Gandhinagar', slug: 'gandhinagar', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 23.2232877, longitude: 72.6492267, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_178', name: 'Ganganagar', slug: 'ganganagar', type: 'CITY', parentId: 'LOC_22', code: null, image: null, description: null, latitude: 23.7497214, longitude: 91.876635, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_179', name: 'Gangtok', slug: 'gangtok', type: 'CITY', parentId: 'LOC_23', code: null, image: null, description: null, latitude: 27.329046, longitude: 88.6122673, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_180', name: 'Gaya', slug: 'gaya', type: 'CITY', parentId: 'LOC_5', code: null, image: null, description: null, latitude: 24.679389, longitude: 85.0115833, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_181', name: 'Ghaziabad', slug: 'ghaziabad', type: 'CITY', parentId: 'LOC_27', code: null, image: null, description: null, latitude: 28.7749966, longitude: 77.4586967, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_182', name: 'Gir Somnath', slug: 'gir-somnath', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 20.9298181, longitude: 70.7627578, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_183', name: 'Giridih', slug: 'giridih', type: 'CITY', parentId: 'LOC_10', code: null, image: null, description: null, latitude: 24.3314546, longitude: 86.1548117, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_185', name: 'Godhra', slug: 'godhra', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 22.7785001, longitude: 73.6245157, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_186', name: 'Gondal', slug: 'gondal', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 21.9575096, longitude: 70.8009896, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_187', name: 'Gondia', slug: 'gondia', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 21.455228, longitude: 80.1962729, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_188', name: 'Gopalganj', slug: 'gopalganj', type: 'CITY', parentId: 'LOC_5', code: null, image: null, description: null, latitude: 26.4211166, longitude: 84.3739133, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_189', name: 'Gorakhpur', slug: 'gorakhpur', type: 'CITY', parentId: 'LOC_27', code: null, image: null, description: null, latitude: 26.6677977, longitude: 83.3642334, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_190', name: 'Gudivada', slug: 'gudivada', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 16.4330413, longitude: 80.9936856, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_191', name: 'Guna', slug: 'guna', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 24.5001772, longitude: 77.2600959, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_192', name: 'Guntakal', slug: 'guntakal', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 15.163811, longitude: 77.3761354, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_193', name: 'Guntur', slug: 'guntur', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 16.2915189, longitude: 80.4541588, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_194', name: 'Gurgaon', slug: 'gurgaon', type: 'CITY', parentId: 'LOC_8', code: null, image: null, description: null, latitude: 28.4646148, longitude: 77.0299194, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_195', name: 'Guwahati', slug: 'guwahati', type: 'CITY', parentId: 'LOC_4', code: null, image: null, description: null, latitude: 26.1805978, longitude: 91.753943, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_196', name: 'Gwalior', slug: 'gwalior', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 26.2037247, longitude: 78.1573628, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_197', name: 'Gyalshing', slug: 'gyalshing', type: 'CITY', parentId: 'LOC_23', code: null, image: null, description: null, latitude: 27.4185174, longitude: 88.1808338, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_198', name: 'Haldwani', slug: 'haldwani', type: 'CITY', parentId: 'LOC_28', code: null, image: null, description: null, latitude: 29.2144809, longitude: 79.5279012, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_199', name: 'Hamirpur', slug: 'hamirpur', type: 'CITY', parentId: 'LOC_9', code: null, image: null, description: null, latitude: 25.75, longitude: 80, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_200', name: 'Haridwar', slug: 'haridwar', type: 'CITY', parentId: 'LOC_28', code: null, image: null, description: null, latitude: 29.9384473, longitude: 78.1452985, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_201', name: 'Hassan', slug: 'hassan', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 13.0301852, longitude: 76.1744968, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_202', name: 'Haveri', slug: 'haveri', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 14.7180268, longitude: 75.3656423, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_203', name: 'Hazaribagh', slug: 'hazaribagh', type: 'CITY', parentId: 'LOC_10', code: null, image: null, description: null, latitude: 24.0866962, longitude: 85.4912231, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_204', name: 'Himmatnagar', slug: 'himmatnagar', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 26.84138, longitude: 74.2700672, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_205', name: 'Hindupur', slug: 'hindupur', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 13.8306127, longitude: 77.492635, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_206', name: 'Hinganghat', slug: 'hinganghat', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 20.542611, longitude: 78.8331636, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_207', name: 'Hisar', slug: 'hisar', type: 'CITY', parentId: 'LOC_8', code: null, image: null, description: null, latitude: 29.2396596, longitude: 75.8174505, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_208', name: 'Hoshiarpur', slug: 'hoshiarpur', type: 'CITY', parentId: 'LOC_21', code: null, image: null, description: null, latitude: 31.6092942, longitude: 75.8459754, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_209', name: 'Hospet', slug: 'hospet', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 15.266493, longitude: 76.3872297, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_210', name: 'Howrah', slug: 'howrah', type: 'CITY', parentId: 'LOC_29', code: null, image: null, description: null, latitude: 22.5736296, longitude: 88.3251045, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_211', name: 'Hubballi', slug: 'hubballi', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 15.3518378, longitude: 75.1379848, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_212', name: 'Hyderabad', slug: 'hyderabad', type: 'CITY', parentId: 'LOC_25', code: null, image: null, description: null, latitude: 17.360589, longitude: 78.4740613, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_213', name: 'Ichalkaranji', slug: 'ichalkaranji', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 16.6959348, longitude: 74.4555755, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_214', name: 'Imphal', slug: 'imphal', type: 'CITY', parentId: 'LOC_15', code: null, image: null, description: null, latitude: 24.7991162, longitude: 93.9364419, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_215', name: 'Indore', slug: 'indore', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 22.7203616, longitude: 75.8681996, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_216', name: 'Itanagar', slug: 'itanagar', type: 'CITY', parentId: 'LOC_3', code: null, image: null, description: null, latitude: 27.0979659, longitude: 93.6237291, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_217', name: 'Itarsi', slug: 'itarsi', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 22.6122527, longitude: 77.7782601, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_218', name: 'Jabalpur', slug: 'jabalpur', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 23.1701522, longitude: 79.9324505, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_219', name: 'Jagdalpur', slug: 'jagdalpur', type: 'CITY', parentId: 'LOC_6', code: null, image: null, description: null, latitude: 19.0870758, longitude: 82.0235715, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_220', name: 'Jagtial', slug: 'jagtial', type: 'CITY', parentId: 'LOC_25', code: null, image: null, description: null, latitude: 18.821359, longitude: 78.9150663, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_221', name: 'Jaipur', slug: 'jaipur', type: 'CITY', parentId: 'LOC_22', code: null, image: null, description: null, latitude: 26.9154576, longitude: 75.8189817, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_222', name: 'Jaisalmer', slug: 'jaisalmer', type: 'CITY', parentId: 'LOC_22', code: null, image: null, description: null, latitude: 26.9116615, longitude: 70.9124888, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_223', name: 'Jajpur', slug: 'jajpur', type: 'CITY', parentId: 'LOC_20', code: null, image: null, description: null, latitude: 20.8746788, longitude: 86.1215393, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_224', name: 'Jalandhar', slug: 'jalandhar', type: 'CITY', parentId: 'LOC_21', code: null, image: null, description: null, latitude: 31.2922312, longitude: 75.5678878, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_225', name: 'Jalgaon', slug: 'jalgaon', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 20.8428827, longitude: 75.5261246, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_226', name: 'Jalna', slug: 'jalna', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 19.918833, longitude: 75.8708599, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_227', name: 'Jalpaiguri', slug: 'jalpaiguri', type: 'CITY', parentId: 'LOC_29', code: null, image: null, description: null, latitude: 26.6262805, longitude: 88.7334485, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_229', name: 'Jamnagar', slug: 'jamnagar', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 22.4732415, longitude: 70.0552102, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_230', name: 'Jamshedpur', slug: 'jamshedpur', type: 'CITY', parentId: 'LOC_10', code: null, image: null, description: null, latitude: 22.8015194, longitude: 86.2029579, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_231', name: 'Jaunpur', slug: 'jaunpur', type: 'CITY', parentId: 'LOC_27', code: null, image: null, description: null, latitude: 25.7967065, longitude: 82.4888992, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_232', name: 'Jhajjar', slug: 'jhajjar', type: 'CITY', parentId: 'LOC_8', code: null, image: null, description: null, latitude: 28.5964461, longitude: 76.6505366, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_233', name: 'Jhansi', slug: 'jhansi', type: 'CITY', parentId: 'LOC_27', code: null, image: null, description: null, latitude: 25.529855, longitude: 78.6527802, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_234', name: 'Jharia', slug: 'jharia', type: 'CITY', parentId: 'LOC_10', code: null, image: null, description: null, latitude: 23.7407998, longitude: 86.4145678, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_235', name: 'Jharsuguda', slug: 'jharsuguda', type: 'CITY', parentId: 'LOC_20', code: null, image: null, description: null, latitude: 21.8019368, longitude: 83.9713964, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_236', name: 'Jind', slug: 'jind', type: 'CITY', parentId: 'LOC_8', code: null, image: null, description: null, latitude: 29.3152073, longitude: 76.314082, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_237', name: 'Jirania', slug: 'jirania', type: 'CITY', parentId: 'LOC_26', code: null, image: null, description: null, latitude: 23.8187413, longitude: 91.4090115, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_238', name: 'Jodhpur', slug: 'jodhpur', type: 'CITY', parentId: 'LOC_22', code: null, image: null, description: null, latitude: 26.2967719, longitude: 73.0351433, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_239', name: 'Jorethang', slug: 'jorethang', type: 'CITY', parentId: 'LOC_23', code: null, image: null, description: null, latitude: 27.131523, longitude: 88.2825347, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_240', name: 'Jorhat', slug: 'jorhat', type: 'CITY', parentId: 'LOC_4', code: null, image: null, description: null, latitude: 26.7577925, longitude: 94.2079645, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_241', name: 'Joshimath', slug: 'joshimath', type: 'CITY', parentId: 'LOC_28', code: null, image: null, description: null, latitude: 30.5555752, longitude: 79.5612607, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_242', name: 'Jowai', slug: 'jowai', type: 'CITY', parentId: 'LOC_16', code: null, image: null, description: null, latitude: 25.4434703, longitude: 92.1973181, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_243', name: 'Junagadh', slug: 'junagadh', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 21.5220416, longitude: 70.4582458, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_244', name: 'Kadapa', slug: 'kadapa', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 14.4752936, longitude: 78.8216861, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_245', name: 'Kadiri', slug: 'kadiri', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 14.1082305, longitude: 78.161069, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_246', name: 'Kailashahar', slug: 'kailashahar', type: 'CITY', parentId: 'LOC_26', code: null, image: null, description: null, latitude: 24.3194297, longitude: 91.9984289, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_247', name: 'Kaithal', slug: 'kaithal', type: 'CITY', parentId: 'LOC_8', code: null, image: null, description: null, latitude: 29.7996588, longitude: 76.3989903, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_248', name: 'Kakching', slug: 'kakching', type: 'CITY', parentId: 'LOC_15', code: null, image: null, description: null, latitude: 24.3890402, longitude: 93.8801324, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_249', name: 'Kakinada', slug: 'kakinada', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 16.9437385, longitude: 82.2350607, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_250', name: 'Kalaburagi', slug: 'kalaburagi', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 17.2408957, longitude: 76.7697439, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_251', name: 'Kalol', slug: 'kalol', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 23.2452165, longitude: 72.4966223, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_252', name: 'Kalyan-Dombivali', slug: 'kalyan-dombivali', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 19.2391602, longitude: 73.1293186, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_253', name: 'Kamalpur', slug: 'kamalpur', type: 'CITY', parentId: 'LOC_26', code: null, image: null, description: null, latitude: 26.3349031, longitude: 91.7144701, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_254', name: 'Kanchipuram', slug: 'kanchipuram', type: 'CITY', parentId: 'LOC_24', code: null, image: null, description: null, latitude: 12.9647163, longitude: 79.9839686, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_255', name: 'Kangra', slug: 'kangra', type: 'CITY', parentId: 'LOC_9', code: null, image: null, description: null, latitude: 32.0768665, longitude: 76.2985872, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_256', name: 'Kannur', slug: 'kannur', type: 'CITY', parentId: 'LOC_12', code: null, image: null, description: null, latitude: 11.8763836, longitude: 75.3737973, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_257', name: 'Kanpur', slug: 'kanpur', type: 'CITY', parentId: 'LOC_27', code: null, image: null, description: null, latitude: 26.4609135, longitude: 80.3217588, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_258', name: 'Karaikkudi', slug: 'karaikkudi', type: 'CITY', parentId: 'LOC_24', code: null, image: null, description: null, latitude: 10.0445121, longitude: 78.7433633, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_259', name: 'Karimnagar', slug: 'karimnagar', type: 'CITY', parentId: 'LOC_25', code: null, image: null, description: null, latitude: 18.4348122, longitude: 79.1328042, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_260', name: 'Karnal', slug: 'karnal', type: 'CITY', parentId: 'LOC_8', code: null, image: null, description: null, latitude: 29.7255766, longitude: 76.9106924, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_261', name: 'Karwar', slug: 'karwar', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 14.8120931, longitude: 74.1319229, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_262', name: 'Kashipur', slug: 'kashipur', type: 'CITY', parentId: 'LOC_28', code: null, image: null, description: null, latitude: 29.2117573, longitude: 78.9617306, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_263', name: 'Katni', slug: 'katni', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 23.7176393, longitude: 80.2610181, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_264', name: 'Kendrapara', slug: 'kendrapara', type: 'CITY', parentId: 'LOC_20', code: null, image: null, description: null, latitude: 20.5475164, longitude: 86.5296168, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_265', name: 'Kendujhar', slug: 'kendujhar', type: 'CITY', parentId: 'LOC_20', code: null, image: null, description: null, latitude: 21.5892323, longitude: 85.6687841, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_266', name: 'Khammam', slug: 'khammam', type: 'CITY', parentId: 'LOC_25', code: null, image: null, description: null, latitude: 17.2465351, longitude: 80.1500326, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_267', name: 'Khandwa', slug: 'khandwa', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 21.8203752, longitude: 76.3555424, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_268', name: 'Kharagpur', slug: 'kharagpur', type: 'CITY', parentId: 'LOC_29', code: null, image: null, description: null, latitude: 22.34309, longitude: 87.3012875, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_269', name: 'Khargone', slug: 'khargone', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 21.9544729, longitude: 75.7521248, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_270', name: 'Kheda', slug: 'kheda', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 22.8532503, longitude: 72.9953586, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_271', name: 'Khowai', slug: 'khowai', type: 'CITY', parentId: 'LOC_26', code: null, image: null, description: null, latitude: 23.9563913, longitude: 91.642107, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_272', name: 'Kochi', slug: 'kochi', type: 'CITY', parentId: 'LOC_12', code: null, image: null, description: null, latitude: 9.9674277, longitude: 76.2454436, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_273', name: 'Kodagu', slug: 'kodagu', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 12.3827332, longitude: 75.6640715, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_274', name: 'Kohima', slug: 'kohima', type: 'CITY', parentId: 'LOC_18', code: null, image: null, description: null, latitude: 25.6618755, longitude: 94.1019156, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_275', name: 'Kolar', slug: 'kolar', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 13.1805066, longitude: 78.2669329, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_276', name: 'Kolasib', slug: 'kolasib', type: 'CITY', parentId: 'LOC_17', code: null, image: null, description: null, latitude: 24.1905469, longitude: 92.7136595, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_277', name: 'Kolhapur', slug: 'kolhapur', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 16.7028412, longitude: 74.2405329, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_278', name: 'Kolkata', slug: 'kolkata', type: 'CITY', parentId: 'LOC_29', code: null, image: null, description: null, latitude: 22.5726459, longitude: 88.3638953, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_279', name: 'Kollam', slug: 'kollam', type: 'CITY', parentId: 'LOC_12', code: null, image: null, description: null, latitude: 8.8872399, longitude: 76.5908768, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_280', name: 'Koraput', slug: 'koraput', type: 'CITY', parentId: 'LOC_20', code: null, image: null, description: null, latitude: 18.7232023, longitude: 82.6100596, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_281', name: 'Korba', slug: 'korba', type: 'CITY', parentId: 'LOC_6', code: null, image: null, description: null, latitude: 22.5198217, longitude: 82.6350029, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_282', name: 'Kota', slug: 'kota', type: 'CITY', parentId: 'LOC_22', code: null, image: null, description: null, latitude: 25.1737019, longitude: 75.8574194, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_283', name: 'Kothagudem', slug: 'kothagudem', type: 'CITY', parentId: 'LOC_25', code: null, image: null, description: null, latitude: 17.5512916, longitude: 80.6144535, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_284', name: 'Kottayam', slug: 'kottayam', type: 'CITY', parentId: 'LOC_12', code: null, image: null, description: null, latitude: 9.6287383, longitude: 76.6455326, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_285', name: 'Kozhikode', slug: 'kozhikode', type: 'CITY', parentId: 'LOC_12', code: null, image: null, description: null, latitude: 11.2450558, longitude: 75.7754716, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_286', name: 'Kullu', slug: 'kullu', type: 'CITY', parentId: 'LOC_9', code: null, image: null, description: null, latitude: 31.9578974, longitude: 77.1089232, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_287', name: 'Kumarghat', slug: 'kumarghat', type: 'CITY', parentId: 'LOC_26', code: null, image: null, description: null, latitude: 24.1493798, longitude: 91.9921237, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_288', name: 'Kundapura', slug: 'kundapura', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 13.6133737, longitude: 74.7286856, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_289', name: 'Kurnool', slug: 'kurnool', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 15.8309251, longitude: 78.0425373, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_290', name: 'Kurukshetra', slug: 'kurukshetra', type: 'CITY', parentId: 'LOC_8', code: null, image: null, description: null, latitude: 29.9693747, longitude: 76.8482787, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_291', name: 'Kutch', slug: 'kutch', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 23.583333, longitude: 70, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_294', name: 'Lansdowne', slug: 'lansdowne', type: 'CITY', parentId: 'LOC_28', code: null, image: null, description: null, latitude: 39.9381682, longitude: -75.2718507, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_295', name: 'Latur', slug: 'latur', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 18.3553347, longitude: 76.7548997, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_296', name: 'Lawngtlai', slug: 'lawngtlai', type: 'CITY', parentId: 'LOC_17', code: null, image: null, description: null, latitude: 22.3913377, longitude: 92.7397189, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_297', name: 'Lohaghat', slug: 'lohaghat', type: 'CITY', parentId: 'LOC_28', code: null, image: null, description: null, latitude: 29.4056017, longitude: 80.115354, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_298', name: 'Lucknow', slug: 'lucknow', type: 'CITY', parentId: 'LOC_27', code: null, image: null, description: null, latitude: 26.8381, longitude: 80.9346001, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_299', name: 'Ludhiana', slug: 'ludhiana', type: 'CITY', parentId: 'LOC_21', code: null, image: null, description: null, latitude: 30.9090157, longitude: 75.851601, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_300', name: 'Lunglei', slug: 'lunglei', type: 'CITY', parentId: 'LOC_17', code: null, image: null, description: null, latitude: 22.9519972, longitude: 92.6338827, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_301', name: 'Machilipatnam', slug: 'machilipatnam', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 16.1817369, longitude: 81.1348181, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_302', name: 'Madanapalle', slug: 'madanapalle', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 13.5557979, longitude: 78.500872, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_303', name: 'Madhubani', slug: 'madhubani', type: 'CITY', parentId: 'LOC_5', code: null, image: null, description: null, latitude: 26.3503076, longitude: 86.2296424, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_304', name: 'Madurai', slug: 'madurai', type: 'CITY', parentId: 'LOC_24', code: null, image: null, description: null, latitude: 9.9261153, longitude: 78.1140983, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_305', name: 'Mahabubnagar', slug: 'mahabubnagar', type: 'CITY', parentId: 'LOC_25', code: null, image: null, description: null, latitude: 16.6965686, longitude: 77.9591146, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_306', name: 'Mahasamund', slug: 'mahasamund', type: 'CITY', parentId: 'LOC_6', code: null, image: null, description: null, latitude: 21.1922846, longitude: 82.4890263, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_307', name: 'Malappuram', slug: 'malappuram', type: 'CITY', parentId: 'LOC_12', code: null, image: null, description: null, latitude: 11.1068448, longitude: 76.1099551, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_308', name: 'Malegaon', slug: 'malegaon', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 20.5576062, longitude: 74.5246514, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_309', name: 'Mamit', slug: 'mamit', type: 'CITY', parentId: 'LOC_17', code: null, image: null, description: null, latitude: 23.7564387, longitude: 92.4515374, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_310', name: 'Manali', slug: 'manali', type: 'CITY', parentId: 'LOC_9', code: null, image: null, description: null, latitude: 32.2454608, longitude: 77.1872926, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_311', name: 'Mancherial', slug: 'mancherial', type: 'CITY', parentId: 'LOC_25', code: null, image: null, description: null, latitude: 18.9812967, longitude: 79.5198096, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_312', name: 'Mandi', slug: 'mandi', type: 'CITY', parentId: 'LOC_9', code: null, image: null, description: null, latitude: 31.6516617, longitude: 77.0092542, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_313', name: 'Mandsaur', slug: 'mandsaur', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 24.2628148, longitude: 75.385692, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_314', name: 'Mandya', slug: 'mandya', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 12.6368939, longitude: 76.7275477, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_315', name: 'Mangalagiri', slug: 'mangalagiri', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 16.4318209, longitude: 80.5688069, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_316', name: 'Mangalore', slug: 'mangalore', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 12.8698101, longitude: 74.8430082, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_317', name: 'Mangan', slug: 'mangan', type: 'CITY', parentId: 'LOC_23', code: null, image: null, description: null, latitude: 27.7489191, longitude: 88.5214387, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_318', name: 'Medininagar', slug: 'medininagar', type: 'CITY', parentId: 'LOC_10', code: null, image: null, description: null, latitude: 24.0397192, longitude: 84.0658109, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_319', name: 'Meerut', slug: 'meerut', type: 'CITY', parentId: 'LOC_27', code: null, image: null, description: null, latitude: 29.0018557, longitude: 77.7679671, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_320', name: 'Mehsana', slug: 'mehsana', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 23.6012628, longitude: 72.3741516, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_321', name: 'Melaghar', slug: 'melaghar', type: 'CITY', parentId: 'LOC_26', code: null, image: null, description: null, latitude: 23.4947164, longitude: 91.3300645, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_322', name: 'Mira-Bhayandar', slug: 'mira-bhayandar', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 19.3101847, longitude: 72.8526988, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_323', name: 'Miryalaguda', slug: 'miryalaguda', type: 'CITY', parentId: 'LOC_25', code: null, image: null, description: null, latitude: 16.8710119, longitude: 79.5617353, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_324', name: 'Moga', slug: 'moga', type: 'CITY', parentId: 'LOC_21', code: null, image: null, description: null, latitude: 30.7877554, longitude: 75.159359, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_325', name: 'Mohali', slug: 'mohali', type: 'CITY', parentId: 'LOC_21', code: null, image: null, description: null, latitude: 30.6659824, longitude: 76.7396095, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_326', name: 'Mohanpur', slug: 'mohanpur', type: 'CITY', parentId: 'LOC_26', code: null, image: null, description: null, latitude: 23.9429191, longitude: 91.3346993, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_327', name: 'Moirang', slug: 'moirang', type: 'CITY', parentId: 'LOC_15', code: null, image: null, description: null, latitude: 24.5005506, longitude: 93.7767476, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_328', name: 'Moradabad', slug: 'moradabad', type: 'CITY', parentId: 'LOC_27', code: null, image: null, description: null, latitude: 28.8796553, longitude: 78.8095335, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_329', name: 'Morbi', slug: 'morbi', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 22.8003959, longitude: 70.886232, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_330', name: 'Moreh', slug: 'moreh', type: 'CITY', parentId: 'LOC_15', code: null, image: null, description: null, latitude: 24.2481189, longitude: 94.3028748, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_331', name: 'Morena', slug: 'morena', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 26.3849794, longitude: 77.8612721, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_332', name: 'Mumbai', slug: 'mumbai', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 19.054999, longitude: 72.8692035, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_333', name: 'Munsyari', slug: 'munsyari', type: 'CITY', parentId: 'LOC_28', code: null, image: null, description: null, latitude: 30.06546, longitude: 80.23453, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_334', name: 'Muzaffarpur', slug: 'muzaffarpur', type: 'CITY', parentId: 'LOC_5', code: null, image: null, description: null, latitude: 26.1482548, longitude: 85.3316097, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_335', name: 'Mysore', slug: 'mysore', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 12.3051828, longitude: 76.6553609, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_336', name: 'Nadiad', slug: 'nadiad', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 22.6895535, longitude: 72.8713603, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_337', name: 'Nagaon', slug: 'nagaon', type: 'CITY', parentId: 'LOC_4', code: null, image: null, description: null, latitude: 26.3313646, longitude: 92.7524763, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_338', name: 'Nagda', slug: 'nagda', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 23.4578957, longitude: 75.4191114, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_339', name: 'Nagercoil', slug: 'nagercoil', type: 'CITY', parentId: 'LOC_24', code: null, image: null, description: null, latitude: 8.1880471, longitude: 77.4290492, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_340', name: 'Nagpur', slug: 'nagpur', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 21.1498134, longitude: 79.0820556, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_341', name: 'Nahan', slug: 'nahan', type: 'CITY', parentId: 'LOC_9', code: null, image: null, description: null, latitude: 30.5601803, longitude: 77.2923596, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_342', name: 'Naharlagun', slug: 'naharlagun', type: 'CITY', parentId: 'LOC_3', code: null, image: null, description: null, latitude: 27.1308555, longitude: 93.709712, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_343', name: 'Nainital', slug: 'nainital', type: 'CITY', parentId: 'LOC_28', code: null, image: null, description: null, latitude: 29.3905295, longitude: 79.460869, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_344', name: 'Nalgonda', slug: 'nalgonda', type: 'CITY', parentId: 'LOC_25', code: null, image: null, description: null, latitude: 16.8579636, longitude: 79.2174935, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_345', name: 'Namchi', slug: 'namchi', type: 'CITY', parentId: 'LOC_23', code: null, image: null, description: null, latitude: 27.3031019, longitude: 88.3785961, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_346', name: 'Namsai', slug: 'namsai', type: 'CITY', parentId: 'LOC_3', code: null, image: null, description: null, latitude: 27.7140306, longitude: 96.0159709, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_347', name: 'Nanded-Waghala', slug: 'nanded-waghala', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 19.169335, longitude: 77.311013, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_348', name: 'Nandurbar', slug: 'nandurbar', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 21.5141622, longitude: 74.5405513, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_349', name: 'Nandyal', slug: 'nandyal', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 15.4736293, longitude: 78.4806592, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_350', name: 'Nanjangud', slug: 'nanjangud', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 12.1220681, longitude: 76.6843409, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_351', name: 'Narasaraopet', slug: 'narasaraopet', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 16.2389242, longitude: 80.0472879, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_352', name: 'Narmada', slug: 'narmada', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 22.9468215, longitude: 81.1047795, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_353', name: 'Narmadapuram', slug: 'narmadapuram', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 22.6002833, longitude: 77.9269848, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_354', name: 'Narnaul', slug: 'narnaul', type: 'CITY', parentId: 'LOC_8', code: null, image: null, description: null, latitude: 28.0438456, longitude: 76.1062015, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_355', name: 'Nashik', slug: 'nashik', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 20.0112475, longitude: 73.7902364, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_356', name: 'Navi Mumbai', slug: 'navi-mumbai', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 19.0308262, longitude: 73.0198537, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_357', name: 'Navsari', slug: 'navsari', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 20.952407, longitude: 72.9323831, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_358', name: 'Nayabazar', slug: 'nayabazar', type: 'CITY', parentId: 'LOC_23', code: null, image: null, description: null, latitude: 27.7206627, longitude: 85.3066352, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_359', name: 'Neemuch', slug: 'neemuch', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 24.6305517, longitude: 75.1829, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_360', name: 'Nellore', slug: 'nellore', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 14.4493717, longitude: 79.9873763, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_361', name: 'New Tehri', slug: 'new-tehri', type: 'CITY', parentId: 'LOC_28', code: null, image: null, description: null, latitude: 30.37445, longitude: 78.43277, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_362', name: 'Nizamabad', slug: 'nizamabad', type: 'CITY', parentId: 'LOC_25', code: null, image: null, description: null, latitude: 18.6732693, longitude: 78.0978477, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_363', name: 'Noida', slug: 'noida', type: 'CITY', parentId: 'LOC_27', code: null, image: null, description: null, latitude: 28.5706333, longitude: 77.3272147, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_364', name: 'Nongpoh', slug: 'nongpoh', type: 'CITY', parentId: 'LOC_16', code: null, image: null, description: null, latitude: 25.8989839, longitude: 91.8812907, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_365', name: 'Nuh', slug: 'nuh', type: 'CITY', parentId: 'LOC_8', code: null, image: null, description: null, latitude: 27.9935177, longitude: 77.0419634, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_366', name: 'Ongole', slug: 'ongole', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 15.5058714, longitude: 80.0499454, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_367', name: 'Osmanabad', slug: 'osmanabad', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 18.2822454, longitude: 76.0588166, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_368', name: 'Palakkad', slug: 'palakkad', type: 'CITY', parentId: 'LOC_12', code: null, image: null, description: null, latitude: 10.7873692, longitude: 76.4742172, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_369', name: 'Palampur', slug: 'palampur', type: 'CITY', parentId: 'LOC_9', code: null, image: null, description: null, latitude: 32.1095492, longitude: 76.5359534, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_370', name: 'Palanpur', slug: 'palanpur', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 24.1709794, longitude: 72.4366375, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_371', name: 'Pali', slug: 'pali', type: 'CITY', parentId: 'LOC_22', code: null, image: null, description: null, latitude: 25.4552211, longitude: 73.419389, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_372', name: 'Panchmahal', slug: 'panchmahal', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 22.6978099, longitude: 73.5980682, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_373', name: 'Panipat', slug: 'panipat', type: 'CITY', parentId: 'LOC_8', code: null, image: null, description: null, latitude: 29.3912753, longitude: 76.9771675, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_374', name: 'Panisagar', slug: 'panisagar', type: 'CITY', parentId: 'LOC_26', code: null, image: null, description: null, latitude: 24.2954598, longitude: 92.1531654, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_375', name: 'Panvel', slug: 'panvel', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 18.9910971, longitude: 73.1205846, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_376', name: 'Paonta Sahib', slug: 'paonta-sahib', type: 'CITY', parentId: 'LOC_9', code: null, image: null, description: null, latitude: 30.4384439, longitude: 77.6211774, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_377', name: 'Parbhani', slug: 'parbhani', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 19.2901981, longitude: 76.6026443, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_378', name: 'Pasighat', slug: 'pasighat', type: 'CITY', parentId: 'LOC_3', code: null, image: null, description: null, latitude: 28.0589676, longitude: 95.3324944, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_379', name: 'Patan', slug: 'patan', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 23.773753, longitude: 71.6798581, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_380', name: 'Pathankot', slug: 'pathankot', type: 'CITY', parentId: 'LOC_21', code: null, image: null, description: null, latitude: 32.3021899, longitude: 75.6589406, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_381', name: 'Patiala', slug: 'patiala', type: 'CITY', parentId: 'LOC_21', code: null, image: null, description: null, latitude: 30.2092778, longitude: 76.3397231, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_382', name: 'Patna', slug: 'patna', type: 'CITY', parentId: 'LOC_5', code: null, image: null, description: null, latitude: 25.6093239, longitude: 85.1235252, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_383', name: 'Pauri', slug: 'pauri', type: 'CITY', parentId: 'LOC_28', code: null, image: null, description: null, latitude: 30.0652314, longitude: 78.7315716, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_384', name: 'Phusro', slug: 'phusro', type: 'CITY', parentId: 'LOC_10', code: null, image: null, description: null, latitude: 23.7601823, longitude: 85.9755003, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_385', name: 'Pimpri-Chinchwad', slug: 'pimpri-chinchwad', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 18.6279288, longitude: 73.8009829, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_386', name: 'Pithampur', slug: 'pithampur', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 22.6105576, longitude: 75.6790283, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_387', name: 'Pithoragarh', slug: 'pithoragarh', type: 'CITY', parentId: 'LOC_28', code: null, image: null, description: null, latitude: 30.1264975, longitude: 80.4816989, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_388', name: 'Porbandar', slug: 'porbandar', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 21.6409, longitude: 69.611, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_389', name: 'Prayagraj', slug: 'prayagraj', type: 'CITY', parentId: 'LOC_27', code: null, image: null, description: null, latitude: 25.4381302, longitude: 81.8338005, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_390', name: 'Proddatur', slug: 'proddatur', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 14.7555953, longitude: 78.5501531, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_392', name: 'Pune', slug: 'pune', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 18.5213738, longitude: 73.8545071, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_393', name: 'Puri', slug: 'puri', type: 'CITY', parentId: 'LOC_20', code: null, image: null, description: null, latitude: 19.8076083, longitude: 85.8252538, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_394', name: 'Purnia', slug: 'purnia', type: 'CITY', parentId: 'LOC_5', code: null, image: null, description: null, latitude: 25.7758723, longitude: 87.4087667, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_395', name: 'Purulia', slug: 'purulia', type: 'CITY', parentId: 'LOC_29', code: null, image: null, description: null, latitude: 23.2020967, longitude: 86.3228988, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_396', name: 'Pushkar', slug: 'pushkar', type: 'CITY', parentId: 'LOC_22', code: null, image: null, description: null, latitude: 26.4876472, longitude: 74.5578484, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_397', name: 'Raichur', slug: 'raichur', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 16.0547194, longitude: 76.9003647, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_398', name: 'Raiganj', slug: 'raiganj', type: 'CITY', parentId: 'LOC_29', code: null, image: null, description: null, latitude: 25.6271966, longitude: 88.1317967, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_399', name: 'Raigarh', slug: 'raigarh', type: 'CITY', parentId: 'LOC_6', code: null, image: null, description: null, latitude: 22.2361795, longitude: 83.3529534, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_400', name: 'Raipur', slug: 'raipur', type: 'CITY', parentId: 'LOC_6', code: null, image: null, description: null, latitude: 21.2380912, longitude: 81.6336993, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_401', name: 'Rajamahendravaram', slug: 'rajamahendravaram', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 17.0050454, longitude: 81.7804732, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_402', name: 'Rajkot', slug: 'rajkot', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 22.3053263, longitude: 70.8028377, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_403', name: 'Rajmahal', slug: 'rajmahal', type: 'CITY', parentId: 'LOC_10', code: null, image: null, description: null, latitude: 25.053055, longitude: 87.8304516, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_404', name: 'Rajnandgaon', slug: 'rajnandgaon', type: 'CITY', parentId: 'LOC_6', code: null, image: null, description: null, latitude: 21.0684425, longitude: 80.7970779, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_405', name: 'Rajpipla', slug: 'rajpipla', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 21.878069, longitude: 73.5039695, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_406', name: 'Ramagundam', slug: 'ramagundam', type: 'CITY', parentId: 'LOC_25', code: null, image: null, description: null, latitude: 18.7615156, longitude: 79.4787848, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_407', name: 'Ramgarh', slug: 'ramgarh', type: 'CITY', parentId: 'LOC_10', code: null, image: null, description: null, latitude: 23.693479, longitude: 85.5215989, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_408', name: 'Ranchi', slug: 'ranchi', type: 'CITY', parentId: 'LOC_10', code: null, image: null, description: null, latitude: 23.3700501, longitude: 85.3250387, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_409', name: 'Ranebennur', slug: 'ranebennur', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 14.6165795, longitude: 75.6341529, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_410', name: 'Rangpo', slug: 'rangpo', type: 'CITY', parentId: 'LOC_23', code: null, image: null, description: null, latitude: 27.1744361, longitude: 88.5303403, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_411', name: 'Ranikhet', slug: 'ranikhet', type: 'CITY', parentId: 'LOC_28', code: null, image: null, description: null, latitude: 29.6323007, longitude: 79.4154142, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_412', name: 'Ranirbazar', slug: 'ranirbazar', type: 'CITY', parentId: 'LOC_26', code: null, image: null, description: null, latitude: 23.4519517, longitude: 91.1770183, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_413', name: 'Ratlam', slug: 'ratlam', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 23.5022201, longitude: 74.9551534, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_414', name: 'Rayagada', slug: 'rayagada', type: 'CITY', parentId: 'LOC_20', code: null, image: null, description: null, latitude: 19.4426698, longitude: 83.5873053, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_415', name: 'Rewa', slug: 'rewa', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 24.7560846, longitude: 81.3810574, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_416', name: 'Rewari', slug: 'rewari', type: 'CITY', parentId: 'LOC_8', code: null, image: null, description: null, latitude: 28.1956468, longitude: 76.6165179, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_417', name: 'Rishikesh', slug: 'rishikesh', type: 'CITY', parentId: 'LOC_28', code: null, image: null, description: null, latitude: 30.1086537, longitude: 78.2916193, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_418', name: 'Rohtak', slug: 'rohtak', type: 'CITY', parentId: 'LOC_8', code: null, image: null, description: null, latitude: 28.9010899, longitude: 76.5801935, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_419', name: 'Roing', slug: 'roing', type: 'CITY', parentId: 'LOC_3', code: null, image: null, description: null, latitude: 28.1368472, longitude: 95.8430824, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_420', name: 'Roorkee', slug: 'roorkee', type: 'CITY', parentId: 'LOC_28', code: null, image: null, description: null, latitude: 29.8693496, longitude: 77.8902124, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_421', name: 'Rourkela', slug: 'rourkela', type: 'CITY', parentId: 'LOC_20', code: null, image: null, description: null, latitude: 22.2309255, longitude: 84.8678705, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_422', name: 'Rudraprayag', slug: 'rudraprayag', type: 'CITY', parentId: 'LOC_28', code: null, image: null, description: null, latitude: 30.4915835, longitude: 79.0366067, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_423', name: 'Rudrapur', slug: 'rudrapur', type: 'CITY', parentId: 'LOC_28', code: null, image: null, description: null, latitude: 28.9707183, longitude: 79.3972845, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_424', name: 'Sabarkantha', slug: 'sabarkantha', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 23.8688505, longitude: 73.013784, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_425', name: 'Sabroom', slug: 'sabroom', type: 'CITY', parentId: 'LOC_26', code: null, image: null, description: null, latitude: 23.013792, longitude: 91.7011609, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_426', name: 'Sagar', slug: 'sagar', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 23.8083076, longitude: 78.758254, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_427', name: 'Sagara', slug: 'sagara', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 32.291777, longitude: 130.838558, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_428', name: 'Saharanpur', slug: 'saharanpur', type: 'CITY', parentId: 'LOC_27', code: null, image: null, description: null, latitude: 29.9856799, longitude: 77.5040646, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_429', name: 'Saiha', slug: 'saiha', type: 'CITY', parentId: 'LOC_17', code: null, image: null, description: null, latitude: 22.2876724, longitude: 93.01336, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_430', name: 'Saitual', slug: 'saitual', type: 'CITY', parentId: 'LOC_17', code: null, image: null, description: null, latitude: 23.8128569, longitude: 92.9727975, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_431', name: 'Sakleshpur', slug: 'sakleshpur', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 12.9434349, longitude: 75.7862318, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_432', name: 'Salem', slug: 'salem', type: 'CITY', parentId: 'LOC_24', code: null, image: null, description: null, latitude: 11.65476, longitude: 78.1588, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_433', name: 'Sambalpur', slug: 'sambalpur', type: 'CITY', parentId: 'LOC_20', code: null, image: null, description: null, latitude: 21.5570606, longitude: 84.1528515, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_434', name: 'Sangli-Miraj & Kupwad', slug: 'sangli-miraj-&-kupwad', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 16.8502534, longitude: 74.5948885, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_435', name: 'Santirbazar', slug: 'santirbazar', type: 'CITY', parentId: 'LOC_26', code: null, image: null, description: null, latitude: 23.3111805, longitude: 91.5626564, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_436', name: 'Saraikela', slug: 'saraikela', type: 'CITY', parentId: 'LOC_10', code: null, image: null, description: null, latitude: 22.7464225, longitude: 85.9168929, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_437', name: 'Satara', slug: 'satara', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 17.6361289, longitude: 74.2982781, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_438', name: 'Satna', slug: 'satna', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 24.6954445, longitude: 80.7770348, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_439', name: 'Sehore', slug: 'sehore', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 23.1150041, longitude: 77.0665356, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_440', name: 'Senapati', slug: 'senapati', type: 'CITY', parentId: 'LOC_15', code: null, image: null, description: null, latitude: 25.3933697, longitude: 94.1505175, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_441', name: 'Seoni', slug: 'seoni', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 22.2748109, longitude: 79.7202522, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_442', name: 'Serchhip', slug: 'serchhip', type: 'CITY', parentId: 'LOC_17', code: null, image: null, description: null, latitude: 23.3052514, longitude: 92.8455123, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_443', name: 'Shahdol', slug: 'shahdol', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 23.3002343, longitude: 81.364771, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_444', name: 'Shantipur', slug: 'shantipur', type: 'CITY', parentId: 'LOC_29', code: null, image: null, description: null, latitude: 23.2464, longitude: 88.4437, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_445', name: 'Shillong', slug: 'shillong', type: 'CITY', parentId: 'LOC_16', code: null, image: null, description: null, latitude: 25.5760446, longitude: 91.8825282, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_446', name: 'Shimla', slug: 'shimla', type: 'CITY', parentId: 'LOC_9', code: null, image: null, description: null, latitude: 31.1041526, longitude: 77.1709729, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_447', name: 'Shimoga', slug: 'shimoga', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 14.0556503, longitude: 75.2380553, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_448', name: 'Shivpuri', slug: 'shivpuri', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 25.3741215, longitude: 77.8278866, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_449', name: 'Siddipet', slug: 'siddipet', type: 'CITY', parentId: 'LOC_25', code: null, image: null, description: null, latitude: 18.0055851, longitude: 78.896113, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_450', name: 'Sikar', slug: 'sikar', type: 'CITY', parentId: 'LOC_22', code: null, image: null, description: null, latitude: 27.6625058, longitude: 75.0279905, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_451', name: 'Silchar', slug: 'silchar', type: 'CITY', parentId: 'LOC_4', code: null, image: null, description: null, latitude: 24.830302, longitude: 92.7875689, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_452', name: 'Siliguri', slug: 'siliguri', type: 'CITY', parentId: 'LOC_29', code: null, image: null, description: null, latitude: 26.7164127, longitude: 88.4309916, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_453', name: 'Singrauli', slug: 'singrauli', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 24.2431343, longitude: 82.3827672, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_454', name: 'Singtam', slug: 'singtam', type: 'CITY', parentId: 'LOC_23', code: null, image: null, description: null, latitude: 27.2319975, longitude: 88.4970841, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_455', name: 'Sirsi', slug: 'sirsi', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 14.6192362, longitude: 74.8388611, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_456', name: 'Siwan', slug: 'siwan', type: 'CITY', parentId: 'LOC_5', code: null, image: null, description: null, latitude: 26.131008, longitude: 84.3910745, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_457', name: 'Solan', slug: 'solan', type: 'CITY', parentId: 'LOC_9', code: null, image: null, description: null, latitude: 42.9431682, longitude: 1.6950613, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_458', name: 'Solapur', slug: 'solapur', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 17.8499067, longitude: 75.2763203, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_459', name: 'Sonamura', slug: 'sonamura', type: 'CITY', parentId: 'LOC_26', code: null, image: null, description: null, latitude: 23.4757939, longitude: 91.2653482, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_460', name: 'Sonipat', slug: 'sonipat', type: 'CITY', parentId: 'LOC_8', code: null, image: null, description: null, latitude: 28.9953758, longitude: 77.0233627, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_461', name: 'Sri Ganganagar', slug: 'sri-ganganagar', type: 'CITY', parentId: 'LOC_22', code: null, image: null, description: null, latitude: 29.5480733, longitude: 73.8338949, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_462', name: 'Srikakulam', slug: 'srikakulam', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 18.2949307, longitude: 83.8938844, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_463', name: 'Sultanganj', slug: 'sultanganj', type: 'CITY', parentId: 'LOC_5', code: null, image: null, description: null, latitude: 25.2414966, longitude: 86.7349906, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_464', name: 'Sundarnagar', slug: 'sundarnagar', type: 'CITY', parentId: 'LOC_9', code: null, image: null, description: null, latitude: 31.4713531, longitude: 76.9004003, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_465', name: 'Surat', slug: 'surat', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 21.2094892, longitude: 72.8317058, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_466', name: 'Surendranagar', slug: 'surendranagar', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 22.8251395, longitude: 71.6209736, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_467', name: 'Suryapet', slug: 'suryapet', type: 'CITY', parentId: 'LOC_25', code: null, image: null, description: null, latitude: 17.0800139, longitude: 79.792533, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_468', name: 'Tadepalligudem', slug: 'tadepalligudem', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 16.8102437, longitude: 81.526592, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_469', name: 'Tadipatri', slug: 'tadipatri', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 14.9069559, longitude: 78.0097071, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_470', name: 'Tawang', slug: 'tawang', type: 'CITY', parentId: 'LOC_3', code: null, image: null, description: null, latitude: 27.6741942, longitude: 91.9362059, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_471', name: 'Teliamura', slug: 'teliamura', type: 'CITY', parentId: 'LOC_26', code: null, image: null, description: null, latitude: 23.8245404, longitude: 91.6316385, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_472', name: 'Tenali', slug: 'tenali', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 16.2377735, longitude: 80.6464219, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_473', name: 'Tezpur', slug: 'tezpur', type: 'CITY', parentId: 'LOC_4', code: null, image: null, description: null, latitude: 26.6169571, longitude: 92.7650072, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_474', name: 'Tezu', slug: 'tezu', type: 'CITY', parentId: 'LOC_3', code: null, image: null, description: null, latitude: 27.9254195, longitude: 96.1647135, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_475', name: 'Thane', slug: 'thane', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 19.1943294, longitude: 72.9701779, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_476', name: 'Thanjavur', slug: 'thanjavur', type: 'CITY', parentId: 'LOC_24', code: null, image: null, description: null, latitude: 10.659037, longitude: 79.2014278, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_477', name: 'Thiruvananthapuram', slug: 'thiruvananthapuram', type: 'CITY', parentId: 'LOC_12', code: null, image: null, description: null, latitude: 8.4882267, longitude: 76.947551, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_478', name: 'Thoothukudi', slug: 'thoothukudi', type: 'CITY', parentId: 'LOC_24', code: null, image: null, description: null, latitude: 8.8457035, longitude: 77.9938178, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_479', name: 'Thoubal', slug: 'thoubal', type: 'CITY', parentId: 'LOC_15', code: null, image: null, description: null, latitude: 24.6252503, longitude: 94.0083522, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_480', name: 'Thrissur', slug: 'thrissur', type: 'CITY', parentId: 'LOC_12', code: null, image: null, description: null, latitude: 10.5270099, longitude: 76.214621, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_481', name: 'Tinsukia', slug: 'tinsukia', type: 'CITY', parentId: 'LOC_4', code: null, image: null, description: null, latitude: 27.4879722, longitude: 95.3601855, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_482', name: 'Tiruchirappalli', slug: 'tiruchirappalli', type: 'CITY', parentId: 'LOC_24', code: null, image: null, description: null, latitude: 10.8071144, longitude: 78.6880939, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_483', name: 'Tirunelveli', slug: 'tirunelveli', type: 'CITY', parentId: 'LOC_24', code: null, image: null, description: null, latitude: 8.7284271, longitude: 77.7112925, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_484', name: 'Tirupati', slug: 'tirupati', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 13.6316368, longitude: 79.4231711, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_485', name: 'Tiruppur', slug: 'tiruppur', type: 'CITY', parentId: 'LOC_24', code: null, image: null, description: null, latitude: 10.7915267, longitude: 77.5325466, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_486', name: 'Tumkur', slug: 'tumkur', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 13.3400771, longitude: 77.1006208, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_487', name: 'Tura', slug: 'tura', type: 'CITY', parentId: 'LOC_16', code: null, image: null, description: null, latitude: 47.60935, longitude: 19.5949442, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_488', name: 'Udaipur', slug: 'udaipur-rajasthan', type: 'CITY', parentId: 'LOC_22', code: null, image: null, description: null, latitude: 24.578721, longitude: 73.6862571, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_489', name: 'Udaipur', slug: 'udaipur-tripura', type: 'CITY', parentId: 'LOC_26', code: null, image: null, description: null, latitude: 24.578721, longitude: 73.6862571, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_490', name: 'Udgir', slug: 'udgir', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 18.3921349, longitude: 77.1196118, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_491', name: 'Udupi', slug: 'udupi', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: 13.3419169, longitude: 74.7473232, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_492', name: 'Ujjain', slug: 'ujjain', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 23.1885131, longitude: 75.7716562, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_493', name: 'Ukhrul', slug: 'ukhrul', type: 'CITY', parentId: 'LOC_15', code: null, image: null, description: null, latitude: 25.3110738, longitude: 94.4753775, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_494', name: 'Ulhasnagar', slug: 'ulhasnagar', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 19.2236329, longitude: 73.1671515, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_495', name: 'Una', slug: 'una-gujarat', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 44.9830709, longitude: 16.2475717, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_496', name: 'Una', slug: 'una-himachal', type: 'CITY', parentId: 'LOC_9', code: null, image: null, description: null, latitude: 44.9830709, longitude: 16.2475717, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_497', name: 'Uttarkashi', slug: 'uttarkashi', type: 'CITY', parentId: 'LOC_28', code: null, image: null, description: null, latitude: 30.9635733, longitude: 78.6362521, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_498', name: 'Vadodara', slug: 'vadodara', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 22.2973142, longitude: 73.1942567, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_499', name: 'Valsad', slug: 'valsad', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 20.4321957, longitude: 73.1409893, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_500', name: 'Vapi', slug: 'vapi', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 20.3735482, longitude: 72.9084376, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_501', name: 'Varanasi', slug: 'varanasi', type: 'CITY', parentId: 'LOC_27', code: null, image: null, description: null, latitude: 25.3356491, longitude: 83.0076292, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_502', name: 'Vasai-Virar', slug: 'vasai-virar', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 19.4210423, longitude: 72.8197221, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_503', name: 'Vellore', slug: 'vellore', type: 'CITY', parentId: 'LOC_24', code: null, image: null, description: null, latitude: 12.9021849, longitude: 79.061104, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_504', name: 'Veraval', slug: 'veraval', type: 'CITY', parentId: 'LOC_7', code: null, image: null, description: null, latitude: 20.9101099, longitude: 70.365279, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_505', name: 'Vidisha', slug: 'vidisha', type: 'CITY', parentId: 'LOC_13', code: null, image: null, description: null, latitude: 23.8463004, longitude: 77.8370209, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_506', name: 'Vijayawada', slug: 'vijayawada', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 16.5115306, longitude: 80.6160469, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_507', name: 'Visakhapatnam', slug: 'visakhapatnam', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 17.6935526, longitude: 83.2921297, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_508', name: 'Vizianagaram', slug: 'vizianagaram', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: 18.1141255, longitude: 83.4114389, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_509', name: 'Warangal', slug: 'warangal', type: 'CITY', parentId: 'LOC_25', code: null, image: null, description: null, latitude: 17.9820644, longitude: 79.5970954, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_510', name: 'Wardha', slug: 'wardha', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 20.8256232, longitude: 78.6131455, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_511', name: 'Williamnagar', slug: 'williamnagar', type: 'CITY', parentId: 'LOC_16', code: null, image: null, description: null, latitude: 25.506085, longitude: 90.60381, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_512', name: 'Yamunanagar', slug: 'yamunanagar', type: 'CITY', parentId: 'LOC_8', code: null, image: null, description: null, latitude: 30.1231349, longitude: 77.286329, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_513', name: 'Yavatmal', slug: 'yavatmal', type: 'CITY', parentId: 'LOC_14', code: null, image: null, description: null, latitude: 20.0638677, longitude: 78.3565663, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_514', name: 'Ziro', slug: 'ziro', type: 'CITY', parentId: 'LOC_3', code: null, image: null, description: null, latitude: 11.675305, longitude: -1.9146626, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_516', name: 'Indira Gandhi International Airport', slug: 'delhi-airport-del', type: 'CITY', parentId: 'LOC_150', code: 'DEL', image: null, description: null, latitude: 28.5562, longitude: 77.1, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_517', name: 'Chhatrapati Shivaji Maharaj International Airport', slug: 'mumbai-airport-bom', type: 'CITY', parentId: 'LOC_332', code: 'BOM', image: null, description: null, latitude: 19.0896, longitude: 72.8656, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_518', name: 'Kempegowda International Airport', slug: 'bangalore-airport-blr', type: 'CITY', parentId: 'LOC_72', code: 'BLR', image: null, description: null, latitude: 13.1986, longitude: 77.7066, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_519', name: 'Chennai International Airport', slug: 'chennai-airport-maa', type: 'CITY', parentId: 'LOC_124', code: 'MAA', image: null, description: null, latitude: 12.9941, longitude: 80.1709, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_520', name: 'Rajiv Gandhi International Airport', slug: 'hyderabad-airport-hyd', type: 'CITY', parentId: 'LOC_212', code: 'HYD', image: null, description: null, latitude: 17.2403, longitude: 78.4294, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_521', name: 'Netaji Subhas Chandra Bose International Airport', slug: 'kolkata-airport-ccu', type: 'CITY', parentId: 'LOC_278', code: 'CCU', image: null, description: null, latitude: 22.6547, longitude: 88.4467, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_522', name: 'Pune International Airport', slug: 'pune-airport-pnq', type: 'CITY', parentId: 'LOC_392', code: 'PNQ', image: null, description: null, latitude: 18.5822, longitude: 73.9197, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_523', name: 'Sardar Vallabhbhai Patel International Airport', slug: 'ahmedabad-airport-amd', type: 'CITY', parentId: 'LOC_35', code: 'AMD', image: null, description: null, latitude: 23.0772, longitude: 72.6347, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_524', name: 'Jaipur International Airport', slug: 'jaipur-airport-jai', type: 'CITY', parentId: 'LOC_221', code: 'JAI', image: null, description: null, latitude: 26.8242, longitude: 75.8122, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_525', name: 'Cochin International Airport', slug: 'kochi-airport-cok', type: 'CITY', parentId: 'LOC_272', code: 'COK', image: null, description: null, latitude: 10.152, longitude: 76.4019, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_526', name: 'Goa International Airport (Dabolim)', slug: 'goa-airport-goi', type: 'CITY', parentId: 'LOC_184', code: 'GOI', image: null, description: null, latitude: 15.3808, longitude: 73.8314, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_527', name: 'Manohar International Airport (Mopa)', slug: 'goa-airport-gox', type: 'CITY', parentId: 'LOC_184', code: 'GOX', image: null, description: null, latitude: 15.7383, longitude: 73.8333, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_528', name: 'Thiruvananthapuram International Airport', slug: 'thiruvananthapuram-airport-trv', type: 'CITY', parentId: 'LOC_477', code: 'TRV', image: null, description: null, latitude: 8.4821, longitude: 76.9199, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_529', name: 'Calicut International Airport', slug: 'kozhikode-airport-ccj', type: 'CITY', parentId: 'LOC_285', code: 'CCJ', image: null, description: null, latitude: 11.1368, longitude: 75.9553, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_530', name: 'Coimbatore International Airport', slug: 'coimbatore-airport-cjb', type: 'CITY', parentId: 'LOC_135', code: 'CJB', image: null, description: null, latitude: 11.03, longitude: 77.0434, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_531', name: 'Mangalore International Airport', slug: 'mangalore-airport-ixe', type: 'CITY', parentId: 'LOC_316', code: 'IXE', image: null, description: null, latitude: 12.9612, longitude: 74.89, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_532', name: 'Sri Guru Ram Dass Jee International Airport', slug: 'amritsar-airport-atq', type: 'CITY', parentId: 'LOC_52', code: 'ATQ', image: null, description: null, latitude: 31.7096, longitude: 74.7973, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_533', name: 'Chandigarh International Airport', slug: 'chandigarh-airport-ixc', type: 'CITY', parentId: 'LOC_120', code: 'IXC', image: null, description: null, latitude: 30.6735, longitude: 76.7885, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_534', name: 'Chaudhary Charan Singh International Airport', slug: 'lucknow-airport-lko', type: 'CITY', parentId: 'LOC_298', code: 'LKO', image: null, description: null, latitude: 26.7606, longitude: 80.8893, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_535', name: 'Lal Bahadur Shastri International Airport', slug: 'varanasi-airport-vns', type: 'CITY', parentId: 'LOC_501', code: 'VNS', image: null, description: null, latitude: 25.452, longitude: 82.8593, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_536', name: 'Jay Prakash Narayan International Airport', slug: 'patna-airport-pat', type: 'CITY', parentId: 'LOC_382', code: 'PAT', image: null, description: null, latitude: 25.5913, longitude: 85.088, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_537', name: 'Jolly Grant Airport', slug: 'dehradun-airport-ded', type: 'CITY', parentId: 'LOC_149', code: 'DED', image: null, description: null, latitude: 30.1897, longitude: 78.1803, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_538', name: 'Kullu-Manali Airport', slug: 'manali-airport-kuu', type: 'CITY', parentId: 'LOC_310', code: 'KUU', image: null, description: null, latitude: 31.8767, longitude: 77.1544, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_539', name: 'Shimla Airport', slug: 'shimla-airport-slv', type: 'CITY', parentId: 'LOC_446', code: 'SLV', image: null, description: null, latitude: 31.0817, longitude: 77.0681, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_540', name: 'Surat Airport', slug: 'surat-airport-stv', type: 'CITY', parentId: 'LOC_465', code: 'STV', image: null, description: null, latitude: 21.1141, longitude: 72.7417, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_541', name: 'Vadodara Airport', slug: 'vadodara-airport-bdq', type: 'CITY', parentId: 'LOC_498', code: 'BDQ', image: null, description: null, latitude: 22.3362, longitude: 73.2264, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_542', name: 'Rajkot Airport', slug: 'rajkot-airport-raj', type: 'CITY', parentId: 'LOC_402', code: 'RAJ', image: null, description: null, latitude: 22.3092, longitude: 70.7795, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_543', name: 'Udaipur Airport', slug: 'udaipur-airport-udr', type: 'CITY', parentId: 'LOC_489', code: 'UDR', image: null, description: null, latitude: 24.6177, longitude: 73.8961, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_544', name: 'Jodhpur Airport', slug: 'jodhpur-airport-jdh', type: 'CITY', parentId: 'LOC_238', code: 'JDH', image: null, description: null, latitude: 26.2511, longitude: 73.0489, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_545', name: 'Raja Bhoj Airport', slug: 'bhopal-airport-bho', type: 'CITY', parentId: 'LOC_99', code: 'BHO', image: null, description: null, latitude: 23.2875, longitude: 77.3374, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_546', name: 'Devi Ahilyabai Holkar Airport', slug: 'indore-airport-idr', type: 'CITY', parentId: 'LOC_215', code: 'IDR', image: null, description: null, latitude: 22.7217, longitude: 75.8011, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_547', name: 'Dr. Babasaheb Ambedkar International Airport', slug: 'nagpur-airport-nag', type: 'CITY', parentId: 'LOC_340', code: 'NAG', image: null, description: null, latitude: 21.0922, longitude: 79.0472, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_548', name: 'Tiruchirappalli International Airport', slug: 'tiruchirappalli-airport-trz', type: 'CITY', parentId: 'LOC_482', code: 'TRZ', image: null, description: null, latitude: 10.7654, longitude: 78.7097, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_549', name: 'Madurai Airport', slug: 'madurai-airport-ixm', type: 'CITY', parentId: 'LOC_304', code: 'IXM', image: null, description: null, latitude: 9.8345, longitude: 78.0934, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_550', name: 'Tirupati Airport', slug: 'tirupati-airport-tir', type: 'CITY', parentId: 'LOC_484', code: 'TIR', image: null, description: null, latitude: 13.6325, longitude: 79.5433, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_551', name: 'Visakhapatnam Airport', slug: 'visakhapatnam-airport-vtz', type: 'CITY', parentId: 'LOC_507', code: 'VTZ', image: null, description: null, latitude: 17.7212, longitude: 83.2245, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_552', name: 'Vijayawada Airport', slug: 'vijayawada-airport-vga', type: 'CITY', parentId: 'LOC_506', code: 'VGA', image: null, description: null, latitude: 16.5304, longitude: 80.7968, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_553', name: 'Mysore Airport', slug: 'mysore-airport-myq', type: 'CITY', parentId: 'LOC_335', code: 'MYQ', image: null, description: null, latitude: 12.23, longitude: 76.6556, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_554', name: 'Lokpriya Gopinath Bordoloi International Airport', slug: 'guwahati-airport-gau', type: 'CITY', parentId: 'LOC_195', code: 'GAU', image: null, description: null, latitude: 26.1061, longitude: 91.5859, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_555', name: 'Biju Patnaik International Airport', slug: 'bhubaneswar-airport-bbi', type: 'CITY', parentId: 'LOC_100', code: 'BBI', image: null, description: null, latitude: 20.2444, longitude: 85.8178, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_556', name: 'Birsa Munda Airport', slug: 'ranchi-airport-ixr', type: 'CITY', parentId: 'LOC_408', code: 'IXR', image: null, description: null, latitude: 23.3143, longitude: 85.3217, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_557', name: 'Bagdogra Airport', slug: 'darjeeling-airport-ixb', type: 'CITY', parentId: 'LOC_145', code: 'IXB', image: null, description: null, latitude: 26.6812, longitude: 88.3286, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_558', name: 'Pakyong Airport', slug: 'gangtok-airport-pyg', type: 'CITY', parentId: 'LOC_179', code: 'PYG', image: null, description: null, latitude: 27.2256, longitude: 88.5869, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_571', name: 'Hubli Airport', slug: 'hubli-airport-hbx', type: 'CITY', parentId: 'LOC_BIKE_HUBLI', code: 'HBX', image: null, description: null, latitude: 15.3617, longitude: 75.0849, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_BIKE_LEH', name: 'Leh', slug: 'leh', type: 'CITY', parentId: 'LOC_292', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_BIKE_COORG', name: 'Coorg', slug: 'coorg', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_BIKE_HAMPI', name: 'Hampi', slug: 'hampi', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_BIKE_HUBLI', name: 'Hubli', slug: 'hubli', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_BIKE_VIZAG', name: 'Vizag', slug: 'vizag', type: 'CITY', parentId: 'LOC_2', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_BIKE_COCHIN', name: 'Cochin', slug: 'cochin', type: 'CITY', parentId: 'LOC_12', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_BIKE_CALICUT', name: 'Calicut', slug: 'calicut', type: 'CITY', parentId: 'LOC_12', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_BIKE_WAYANAD', name: 'Wayanad', slug: 'wayanad', type: 'CITY', parentId: 'LOC_12', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_BIKE_BELAGAVI', name: 'Belagavi', slug: 'belagavi', type: 'CITY', parentId: 'LOC_11', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_BIKE_GURUGRAM', name: 'Gurugram', slug: 'gurugram', type: 'CITY', parentId: 'LOC_8', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_BIKE_TRIVANDRUM', name: 'Trivandrum', slug: 'trivandrum', type: 'CITY', parentId: 'LOC_12', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
  { id: 'LOC_BIKE_PONDICHERRY', name: 'Pondicherry', slug: 'pondicherry', type: 'CITY', parentId: 'LOC_391', code: null, image: null, description: null, latitude: null, longitude: null, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
];

// Areas (1)
const AREAS = [
  { id: 'LOC_515', name: 'Pelling', slug: 'pelling', type: 'AREA', parentId: 'LOC_179', code: null, image: null, description: null, latitude: 27.3003722, longitude: 88.2356503, timezone: 'Asia/Kolkata', isActive: true, displayOrder: 0, metaTitle: null, metaDescription: null },
];

// Airports (0)
const AIRPORTS = [
];

// ============================================
// SEED FUNCTIONS
// ============================================

async function seedServices() {
  console.log('\n🔧 Seeding services...');
  console.log('=' .repeat(60));

  // First seed parent services
  console.log('\n📁 Seeding parent services...');
  let parentCount = 0;
  for (const service of PARENT_SERVICES) {
    try {
      await prisma.services.upsert({
        where: { id: service.id },
        update: {
          name: service.name,
          slug: service.slug,
          parentId: service.parentId,
          description: service.description,
          shortDesc: service.shortDesc,
          icon: service.icon,
          image: service.image,
          flowType: service.flowType,
          config: service.config,
          formFields: service.formFields,
          isActive: service.isActive,
          displayOrder: service.displayOrder,
          metaTitle: service.metaTitle,
          metaDescription: service.metaDescription,
        },
        create: {
          id: service.id,
          name: service.name,
          slug: service.slug,
          parentId: service.parentId,
          description: service.description,
          shortDesc: service.shortDesc,
          icon: service.icon,
          image: service.image,
          flowType: service.flowType,
          config: service.config,
          formFields: service.formFields,
          isActive: service.isActive,
          displayOrder: service.displayOrder,
          metaTitle: service.metaTitle,
          metaDescription: service.metaDescription,
        },
      });
      parentCount++;
      process.stdout.write(`\r   ✅ Progress: ${parentCount}/${PARENT_SERVICES.length} parent services`);
    } catch (error) {
      console.error(`\n   ❌ Failed to seed service ${service.name}:`, error.message);
    }
  }
  console.log(`\n   ✅ ${parentCount} parent services seeded\n`);

  // Then seed child services
  console.log('📂 Seeding child services...');
  let childCount = 0;
  for (const service of CHILD_SERVICES) {
    try {
      await prisma.services.upsert({
        where: { id: service.id },
        update: {
          name: service.name,
          slug: service.slug,
          parentId: service.parentId,
          description: service.description,
          shortDesc: service.shortDesc,
          icon: service.icon,
          image: service.image,
          flowType: service.flowType,
          config: service.config,
          formFields: service.formFields,
          isActive: service.isActive,
          displayOrder: service.displayOrder,
          metaTitle: service.metaTitle,
          metaDescription: service.metaDescription,
        },
        create: {
          id: service.id,
          name: service.name,
          slug: service.slug,
          parentId: service.parentId,
          description: service.description,
          shortDesc: service.shortDesc,
          icon: service.icon,
          image: service.image,
          flowType: service.flowType,
          config: service.config,
          formFields: service.formFields,
          isActive: service.isActive,
          displayOrder: service.displayOrder,
          metaTitle: service.metaTitle,
          metaDescription: service.metaDescription,
        },
      });
      childCount++;
      process.stdout.write(`\r   ✅ Progress: ${childCount}/${CHILD_SERVICES.length} child services`);
    } catch (error) {
      console.error(`\n   ❌ Failed to seed child service ${service.name}:`, error.message);
    }
  }
  console.log(`\n   ✅ ${childCount} child services seeded`);

  console.log(`\n✅ Total services seeded: ${parentCount + childCount}`);
}

async function seedLocations() {
  console.log('\n📍 Seeding locations...');
  console.log('=' .repeat(60));

  // Seed in hierarchy order: Countries -> States -> Cities -> Areas -> Airports

  console.log('\n🌍 Seeding countries...');
  let countryCount = 0;
  for (const loc of COUNTRIES) {
    try {
      await prisma.locations.upsert({
        where: { id: loc.id },
        update: {
          name: loc.name,
          slug: loc.slug,
          type: loc.type,
          parentId: loc.parentId,
          code: loc.code,
          image: loc.image,
          description: loc.description,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timezone: loc.timezone,
          isActive: loc.isActive,
          displayOrder: loc.displayOrder,
          metaTitle: loc.metaTitle,
          metaDescription: loc.metaDescription,
        },
        create: {
          id: loc.id,
          name: loc.name,
          slug: loc.slug,
          type: loc.type,
          parentId: loc.parentId,
          code: loc.code,
          image: loc.image,
          description: loc.description,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timezone: loc.timezone,
          isActive: loc.isActive,
          displayOrder: loc.displayOrder,
          metaTitle: loc.metaTitle,
          metaDescription: loc.metaDescription,
        },
      });
      countryCount++;
      process.stdout.write(`\r   ✅ Progress: ${countryCount}/${COUNTRIES.length} countries`);
    } catch (error) {
      console.error(`\n   ❌ Failed to seed country ${loc.name}:`, error.message);
    }
  }
  console.log(`\n   ✅ ${countryCount} countries seeded\n`);

  console.log('🗺️  Seeding states...');
  let stateCount = 0;
  for (const loc of STATES) {
    try {
      await prisma.locations.upsert({
        where: { id: loc.id },
        update: {
          name: loc.name,
          slug: loc.slug,
          type: loc.type,
          parentId: loc.parentId,
          code: loc.code,
          image: loc.image,
          description: loc.description,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timezone: loc.timezone,
          isActive: loc.isActive,
          displayOrder: loc.displayOrder,
          metaTitle: loc.metaTitle,
          metaDescription: loc.metaDescription,
        },
        create: {
          id: loc.id,
          name: loc.name,
          slug: loc.slug,
          type: loc.type,
          parentId: loc.parentId,
          code: loc.code,
          image: loc.image,
          description: loc.description,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timezone: loc.timezone,
          isActive: loc.isActive,
          displayOrder: loc.displayOrder,
          metaTitle: loc.metaTitle,
          metaDescription: loc.metaDescription,
        },
      });
      stateCount++;
      process.stdout.write(`\r   ✅ Progress: ${stateCount}/${STATES.length} states`);
    } catch (error) {
      console.error(`\n   ❌ Failed to seed state ${loc.name}:`, error.message);
    }
  }
  console.log(`\n   ✅ ${stateCount} states seeded\n`);

  console.log('🏙️  Seeding cities...');
  let cityCount = 0;
  for (const loc of CITIES) {
    try {
      await prisma.locations.upsert({
        where: { id: loc.id },
        update: {
          name: loc.name,
          slug: loc.slug,
          type: loc.type,
          parentId: loc.parentId,
          code: loc.code,
          image: loc.image,
          description: loc.description,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timezone: loc.timezone,
          isActive: loc.isActive,
          displayOrder: loc.displayOrder,
          metaTitle: loc.metaTitle,
          metaDescription: loc.metaDescription,
        },
        create: {
          id: loc.id,
          name: loc.name,
          slug: loc.slug,
          type: loc.type,
          parentId: loc.parentId,
          code: loc.code,
          image: loc.image,
          description: loc.description,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timezone: loc.timezone,
          isActive: loc.isActive,
          displayOrder: loc.displayOrder,
          metaTitle: loc.metaTitle,
          metaDescription: loc.metaDescription,
        },
      });
      cityCount++;
      process.stdout.write(`\r   ✅ Progress: ${cityCount}/${CITIES.length} cities`);
    } catch (error) {
      console.error(`\n   ❌ Failed to seed city ${loc.name}:`, error.message);
    }
  }
  console.log(`\n   ✅ ${cityCount} cities seeded\n`);

  console.log('📍 Seeding areas...');
  let areaCount = 0;
  for (const loc of AREAS) {
    try {
      await prisma.locations.upsert({
        where: { id: loc.id },
        update: {
          name: loc.name,
          slug: loc.slug,
          type: loc.type,
          parentId: loc.parentId,
          code: loc.code,
          image: loc.image,
          description: loc.description,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timezone: loc.timezone,
          isActive: loc.isActive,
          displayOrder: loc.displayOrder,
          metaTitle: loc.metaTitle,
          metaDescription: loc.metaDescription,
        },
        create: {
          id: loc.id,
          name: loc.name,
          slug: loc.slug,
          type: loc.type,
          parentId: loc.parentId,
          code: loc.code,
          image: loc.image,
          description: loc.description,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timezone: loc.timezone,
          isActive: loc.isActive,
          displayOrder: loc.displayOrder,
          metaTitle: loc.metaTitle,
          metaDescription: loc.metaDescription,
        },
      });
      areaCount++;
      process.stdout.write(`\r   ✅ Progress: ${areaCount}/${AREAS.length} areas`);
    } catch (error) {
      console.error(`\n   ❌ Failed to seed area ${loc.name}:`, error.message);
    }
  }
  console.log(`\n   ✅ ${areaCount} areas seeded\n`);

  console.log('✈️  Seeding airports...');
  let airportCount = 0;
  for (const loc of AIRPORTS) {
    try {
      await prisma.locations.upsert({
        where: { id: loc.id },
        update: {
          name: loc.name,
          slug: loc.slug,
          type: loc.type,
          parentId: loc.parentId,
          code: loc.code,
          image: loc.image,
          description: loc.description,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timezone: loc.timezone,
          isActive: loc.isActive,
          displayOrder: loc.displayOrder,
          metaTitle: loc.metaTitle,
          metaDescription: loc.metaDescription,
        },
        create: {
          id: loc.id,
          name: loc.name,
          slug: loc.slug,
          type: loc.type,
          parentId: loc.parentId,
          code: loc.code,
          image: loc.image,
          description: loc.description,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timezone: loc.timezone,
          isActive: loc.isActive,
          displayOrder: loc.displayOrder,
          metaTitle: loc.metaTitle,
          metaDescription: loc.metaDescription,
        },
      });
      airportCount++;
      process.stdout.write(`\r   ✅ Progress: ${airportCount}/${AIRPORTS.length} airports`);
    } catch (error) {
      console.error(`\n   ❌ Failed to seed airport ${loc.name}:`, error.message);
    }
  }
  console.log(`\n   ✅ ${airportCount} airports seeded`);

  const totalLocations = countryCount + stateCount + cityCount + areaCount + airportCount;
  console.log(`\n✅ Total locations seeded: ${totalLocations}`);
}

async function main() {
  console.log('\n🌱 Starting Locations & Services Seed\n');
  console.log('=' .repeat(60));

  try {
    await seedLocations();
    await seedServices();

    console.log('\n' + '=' .repeat(60));
    console.log('🎉 Seed completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
