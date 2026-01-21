const fs = require('fs');
const path = require('path');

const services = [
  { dir: 'bike', id: 'bike', name: 'Bike Rental', component: 'Bike' },
  { dir: 'bus', id: 'bus', name: 'Bus Rental', component: 'Bus' },
  { dir: 'truck', id: 'truck', name: 'Truck Rental', component: 'Truck' },
  { dir: 'luxury', id: 'luxury', name: 'Luxury Car', component: 'Luxury' },
  { dir: 'packers', id: 'packers', name: 'Packers & Movers', component: 'Packers' },
  { dir: 'equipment', id: 'equipment', name: 'Equipment Rental', component: 'Equipment' },
  { dir: 'self-drive', id: 'self-drive', name: 'Self Drive', component: 'SelfDrive' }
];

const baseDir = 'C:/transrentals-new/tr-vendor-app/screens/vendor/services';
