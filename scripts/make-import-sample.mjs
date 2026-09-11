// Builds a sample call-report import sheet into demo/, using real service and
// location names from the database so the rows actually import cleanly.
import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('demo');
const OUT_FILE = path.join(OUT_DIR, 'call-reports-import-sample.xlsx');

// Column names exactly as the page's "Export as Sheet" writes them, so an exported
// file can be edited and imported straight back.
const HEADER = [
  'Date', 'Contact Type', 'Vendor Name', 'Company Name', 'Company Details',
  'Phone', 'Email', 'Address', 'City', 'Service', 'Location', 'Status', 'Notes',
  'Next Follow Up Date', 'Next Follow Up Time', 'Next Action',
];

const ROWS = [
  ['2026-09-10', 'Vendor', 'Shree Bike Rentals', 'Shree Enterprises', 'Fleet of 20 scooters',
   '9812345601', 'shree.bikes@example.com', 'MI Road, Near Ajmeri Gate', 'Jaipur',
   'Bike Rental', 'Jaipur', 'Interested', 'Wants commission details',
   '2026-09-15', '11:00', 'Send rate card'],

  ['2026-09-10', 'Vendor', 'Marwar Self Drive', 'Marwar Motors', '12 hatchbacks, 4 SUVs',
   '9812345602', 'marwar.sd@example.com', 'Shastri Nagar', 'Jodhpur',
   'Self Drive Car Rental; Car Rental', 'Jodhpur; Jaipur', 'Follow Up', 'Asked to call back after Monday',
   '2026-09-16', '16:30', 'Second call'],

  ['2026-09-11', 'Travel Agent', 'Blue Sky Travels', 'Blue Sky Holidays', 'Corporate bus bookings',
   '9812345603', 'bluesky@example.com', 'Civil Lines', 'Agra',
   'Bus Rental', 'Agra', 'Vendor Created', 'Onboarded, agreement pending',
   '', '', ''],

  ['2026-09-11', 'Vendor', 'Ahmedabad Truckers', 'AT Logistics', '6 mini trucks',
   '9812345604', 'at.logistics@example.com', 'SG Highway', 'Ahmedabad',
   'Truck Rental; Packers and Movers', 'Ahmedabad', 'Callback Later', 'Owner travelling this week',
   '2026-09-18', '10:00', 'Call owner directly'],

  ['2026-09-11', 'Vendor', 'Royal Luxury Cars', 'Royal Motors', 'Fortuner, Innova Crysta',
   '9812345605', 'royal.luxury@example.com', 'Vaishali Nagar', 'Jaipur',
   'Luxury Car', 'Jaipur; Udaipur', 'Not Interested', 'Already tied up with a competitor',
   '', '', ''],

  ['2026-09-11', 'Vendor', 'Adilabad Equipment Co', '', 'JCB and excavator hire',
   '9812345606', '', 'Main Market', 'Adilabad',
   'Equipment Rental', 'Adilabad', 'No Answer', 'Phone unreachable, retry',
   '2026-09-14', '09:30', 'Retry call'],
];

fs.mkdirSync(OUT_DIR, { recursive: true });

const ws = XLSX.utils.aoa_to_sheet([HEADER, ...ROWS]);
ws['!cols'] = HEADER.map((h, i) => ({
  wch: Math.min(38, Math.max(h.length + 2, ...ROWS.map((r) => String(r[i] ?? '').length + 2))),
}));

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Call Reports');
XLSX.writeFile(wb, OUT_FILE);

console.log(`Wrote ${OUT_FILE}`);
console.log(`${ROWS.length} rows, ${HEADER.length} columns`);
