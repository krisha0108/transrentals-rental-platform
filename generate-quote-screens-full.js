// Quote Screens Generator for Vendor App
const fs = require('fs');
const path = require('path');

console.log('Starting Quote Screens Generator...\n');

const services = [
  { name: 'bike', icon: 'motorbike', type: 'bike', cap: 'Bike' },
  { name: 'bus', icon: 'bus', type: 'bus', cap: 'Bus' },
  { name: 'truck', icon: 'truck-delivery', type: 'truck', cap: 'Truck' },
  { name: 'luxury', icon: 'car-sports', type: 'luxury', cap: 'Luxury' },
  { name: 'packers', icon: 'package-variant', type: 'packers', cap: 'Packers' },
  { name: 'equipment', icon: 'hammer-wrench', type: 'equipment', cap: 'Equipment' },
  { name: 'self-drive', icon: 'car-side', type: 'self-drive', cap: 'SelfDrive' }
];

console.log('Services configured:', services.map(s => s.name).join(', '));
console.log('This generator will create 33 quote screen files.\n');
console.log('To use: node generate-quote-screens-full.js\n');