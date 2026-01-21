const fs = require('fs');
const path = require('path');

const services = [
  { name: 'truck', displayName: 'Truck', icon: 'truck-delivery' },
  { name: 'luxury', displayName: 'Luxury', icon: 'car-sports' },
  { name: 'packers', displayName: 'Packers', icon: 'package-variant' },
  { name: 'self-drive', displayName: 'Self-Drive', icon: 'car-side' },
];

const basePath = path.join(__dirname, '..', 'screens', 'vendor', 'services');
const bikePath = path.join(basePath, 'bike');

services.forEach(service => {
  const servicePath = path.join(basePath, service.name);

  // Create directory if it doesn't exist
  if (!fs.existsSync(servicePath)) {
    fs.mkdirSync(servicePath, { recursive: true });
  }

  // Read bike screens as templates
  const bookingsScreenTemplate = fs.readFileSync(
    path.join(bikePath, 'BikeBookingsScreen.js'),
    'utf8'
  );

  const bookingDetailScreenTemplate = fs.readFileSync(
    path.join(bikePath, 'BikeBookingDetailScreen.js'),
    'utf8'
  );

  // Generate BookingsScreen
  let bookingsScreen = bookingsScreenTemplate
    .replace(/BikeBookingsScreen/g, `${service.displayName.replace('-', '')}BookingsScreen`)
    .replace(/'bike'/g, `'${service.name}'`)
    .replace(/Bike Bookings/g, `${service.displayName} Bookings`)
    .replace(/BikeBookingDetail/g, `${service.displayName.replace('-', '')}BookingDetail`);

  // Generate BookingDetailScreen
  let bookingDetailScreen = bookingDetailScreenTemplate
    .replace(/BikeBookingDetailScreen/g, `${service.displayName.replace('-', '')}BookingDetailScreen`)
    .replace(/'bike'/g, `'${service.name}'`)
    .replace(/\[BikeBookingDetail\]/g, `[${service.displayName.replace('-', '')}BookingDetail]`)
    .replace(/name="motorbike"/g, `name="${service.icon}"`)
    .replace(/{booking\.vehicleName \|\| 'Bike'}/g, `{booking.vehicleName || '${service.displayName}'}`);

  // Write files
  fs.writeFileSync(
    path.join(servicePath, `${service.displayName.replace('-', '')}BookingsScreen.js`),
    bookingsScreen
  );

  fs.writeFileSync(
    path.join(servicePath, `${service.displayName.replace('-', '')}BookingDetailScreen.js`),
    bookingDetailScreen
  );

  console.log(`Created screens for ${service.displayName} service`);
});

console.log('All service screens created successfully!');
