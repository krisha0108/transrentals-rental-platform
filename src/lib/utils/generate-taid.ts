import { prisma } from '@/lib/db/prisma';

// Generates the next sequential Travel Agent ID: ta-0001, ta-0002, ...
// Mirrors generateVid() for vendors (vn-xxxx).
export async function generateTaid(): Promise<string> {
  const last = await prisma.travel_agents.findFirst({
    where: { tid: { not: null } },
    orderBy: { tid: 'desc' },
    select: { tid: true },
  });

  let num = 1;
  if (last?.tid) {
    const match = last.tid.match(/^ta-(\d+)$/);
    if (match) num = parseInt(match[1], 10) + 1;
  }

  return `ta-${String(num).padStart(4, '0')}`;
}
