import { prisma } from '@/lib/db/prisma';

export async function generateDid(): Promise<string> {
  const [lastDriver, lastStaff] = await Promise.all([
    prisma.drivers.findFirst({
      where: { did: { not: null } },
      orderBy: { did: 'desc' },
      select: { did: true },
    }),
    prisma.vendor_staff.findFirst({
      where: { did: { not: null } },
      orderBy: { did: 'desc' },
      select: { did: true },
    }),
  ]);

  const parseNum = (did: string | null | undefined) => {
    if (!did) return 0;
    const m = did.match(/^dr-(\d+)$/);
    return m ? parseInt(m[1], 10) : 0;
  };

  const num = Math.max(parseNum(lastDriver?.did), parseNum(lastStaff?.did)) + 1;
  return `dr-${String(num).padStart(4, '0')}`;
}
