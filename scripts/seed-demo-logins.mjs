// Local testing helper: set known passwords on the demo accounts and seed a
// call sheet that covers every branch worth eyeballing.
//
// Local database only — it touches the three `*-demo-*-local` rows and its own
// DEMO- call reports, nothing else. Re-running it is safe: the reports are
// deleted and rebuilt each time.
//
//   node scripts/seed-demo-logins.mjs
//   node scripts/seed-demo-logins.mjs --clean    (remove the seeded reports)
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Overridable, but the default is fine because this script refuses to run
// anywhere but a local database (see the guard below).
const PASSWORD = process.env.DEMO_PASSWORD || 'Demo@1234';
const ACCOUNTS = [
  { id: 'user-demo-admin-local', label: 'Admin' },
  { id: 'user-demo-manager-local', label: 'Manager' },
];
const MANAGER_ID = 'user-demo-manager-local';
// Every seeded report carries this so the cleanup never reaches a real row.
const TAG = 'DEMO-CR';

const clean = process.argv.includes('--clean');

// This script resets passwords and writes rows. Pointed at production by an
// inherited DATABASE_URL it would hand a known password to a SUPER_ADMIN
// account and drop demo leads into the live call sheet, so it only ever runs
// against a database on this machine.
function assertLocalDatabase() {
  const url = process.env.DATABASE_URL || '';
  const host = (url.match(/@([^/:]+)/) || [])[1] || '';
  const local = ['localhost', '127.0.0.1', '::1', '[::1]'];
  if (!local.includes(host)) {
    console.error(`\n  Refusing to run: DATABASE_URL points at "${host || 'an unknown host'}".`);
    console.error('  This seeds demo accounts and resets their passwords, so it is local-only.\n');
    process.exit(1);
  }
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(11, 30, 0, 0);
  return d;
}

// One row per branch the call-report screens can take, so each can be checked
// by opening it rather than by contriving the state by hand.
const REPORTS = [
  {
    key: 'already-vendor',
    vendorName: 'Ramesh Patel',
    companyName: 'DEMO — Already a Vendor (no profile linked)',
    contactType: 'VENDOR',
    status: 'VENDOR_CREATED',
    notes: 'Status says Vendor Created but no vendor profile is linked. View/Edit must say "Already a Vendor" — never "Ready to Become Vendor".',
    city: 'Ahmedabad',
    phone: '9000000101',
    days: 1,
  },
  {
    key: 'already-converted',
    vendorName: 'Suresh Shah',
    companyName: 'DEMO — Converted, no profile linked',
    contactType: 'VENDOR',
    status: 'CONVERTED',
    notes: 'Same as above via the CONVERTED status.',
    city: 'Surat',
    phone: '9000000102',
    days: 2,
  },
  {
    key: 'already-agent',
    vendorName: 'Nisha Mehta',
    companyName: 'DEMO — Already a Travel Agent (no profile linked)',
    contactType: 'TRAVEL_AGENT',
    status: 'TRAVEL_AGENT_CREATED',
    notes: 'Travel agent side of the same case. Must say "Already a Travel Agent".',
    city: 'Vadodara',
    phone: '9000000103',
    days: 2,
  },
  {
    key: 'open-lead',
    vendorName: 'Imran Qureshi',
    companyName: 'DEMO — Open lead (should still offer conversion)',
    contactType: 'VENDOR',
    status: 'FOLLOW_UP',
    notes: 'Control case: still a lead, so "Ready to Become Vendor" is correct here.',
    city: 'Rajkot',
    phone: '9000000104',
    days: 3,
  },
  {
    key: 'agent-lead',
    vendorName: 'Priya Desai',
    companyName: 'DEMO — Open travel agent lead',
    contactType: 'TRAVEL_AGENT',
    status: 'INTERESTED',
    notes: 'Control case for the travel agent path.',
    city: 'Ahmedabad',
    phone: '9000000105',
    days: 4,
  },
  {
    key: 'flagged',
    vendorName: 'Duplicate Entry',
    companyName: 'DEMO — Flagged for admin review',
    contactType: 'VENDOR',
    status: 'WRONG_NUMBER',
    notes: 'Flagged row: check the amber highlight, the Flagged filter, and the admin delete.',
    city: 'Ahmedabad',
    phone: '9000000106',
    days: 5,
    isFlagged: true,
    flagReason: 'Duplicate entry — same number already logged twice',
  },
];

async function main() {
  assertLocalDatabase();
  const manager = await prisma.admin_users.findUnique({ where: { id: MANAGER_ID }, select: { id: true, name: true } });
  if (!manager) {
    console.log('\n  Demo manager row is missing — nothing to attach reports to.');
    return;
  }

  // Cleanup first so re-running never stacks duplicates.
  const removed = await prisma.manager_call_reports.deleteMany({
    where: { managerId: MANAGER_ID, companyDetails: TAG },
  });
  if (removed.count) console.log(`\n  Removed ${removed.count} previously seeded report(s).`);
  if (clean) {
    console.log('  --clean: done, passwords left untouched.\n');
    return;
  }

  const hash = await bcrypt.hash(PASSWORD, 12);
  console.log('\n  Logins');
  console.log('  ─────────────────────────────────────────────────────────────');
  for (const acct of ACCOUNTS) {
    const user = await prisma.admin_users.findUnique({ where: { id: acct.id }, select: { id: true, name: true, email: true, role: true } });
    if (!user) { console.log(`  ${acct.label.padEnd(8)} MISSING (${acct.id})`); continue; }
    await prisma.admin_users.update({ where: { id: user.id }, data: { password: hash, isActive: true } });
    console.log(`  ${acct.label.padEnd(8)} ${user.email.padEnd(34)} ${PASSWORD}   [${user.role}]`);
  }

  console.log('\n  Seeded call reports (manager: ' + manager.name + ')');
  console.log('  ─────────────────────────────────────────────────────────────');
  for (const r of REPORTS) {
    const created = await prisma.manager_call_reports.create({
      data: {
        managerId: MANAGER_ID,
        vendorName: r.vendorName,
        companyName: r.companyName,
        companyDetails: TAG,
        phone: r.phone,
        email: `${r.key}@demo.local`,
        city: r.city,
        address: `${r.city} — demo address`,
        contactType: r.contactType,
        status: r.status,
        notes: r.notes,
        isFlagged: r.isFlagged || false,
        flagReason: r.flagReason || null,
        flaggedAt: r.isFlagged ? new Date() : null,
        flaggedById: r.isFlagged ? MANAGER_ID : null,
        callDate: daysAgo(r.days),
      },
      select: { id: true, status: true, contactType: true, companyName: true },
    });
    console.log(`  ${created.status.padEnd(22)} ${created.companyName}`);
  }

  const total = await prisma.manager_call_reports.count({ where: { managerId: MANAGER_ID } });
  const flagged = await prisma.manager_call_reports.count({ where: { managerId: MANAGER_ID, isFlagged: true } });
  console.log(`\n  Demo Manager now has ${total} call report(s), ${flagged} flagged.\n`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
