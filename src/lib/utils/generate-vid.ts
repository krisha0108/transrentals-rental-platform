import { prisma } from '@/lib/db/prisma';

export async function generateVid(): Promise<string> {
  const last = await prisma.vendors.findFirst({
    where: { vid: { not: null } },
    orderBy: { vid: 'desc' },
    select: { vid: true },
  });

  let num = 1;
  if (last?.vid) {
    const match = last.vid.match(/^vn-(\d+)$/);
    if (match) num = parseInt(match[1], 10) + 1;
  }

  return `vn-${String(num).padStart(4, '0')}`;
}
