import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const travelAgentId = auth.travelAgentId;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(todayStart);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const [
      totalLeads,
      newLeads,
      hotLeads,
      bookedLeads,
      lostLeads,
      thisMonthLeads,
      followUpsToday,
      followUpsThisWeek,
      totalTours,
      activeTours,
      totalProperties,
      activeProperties,
      totalFleet,
      activeFleet,
      totalBookings,
      confirmedBookings,
      thisMonthBookings,
      totalEarningsAgg,
    ] = await Promise.all([
      prisma.travel_agent_leads.count({ where: { travelAgentId } }),
      prisma.travel_agent_leads.count({ where: { travelAgentId, status: 'NEW' } }),
      prisma.travel_agent_leads.count({ where: { travelAgentId, priority: 'HOT' } }),
      prisma.travel_agent_leads.count({ where: { travelAgentId, status: 'BOOKED' } }),
      prisma.travel_agent_leads.count({ where: { travelAgentId, status: 'LOST' } }),
      prisma.travel_agent_leads.count({
        where: { travelAgentId, createdAt: { gte: monthStart } },
      }),
      prisma.travel_agent_leads.count({
        where: {
          travelAgentId,
          nextFollowUp: { gte: todayStart, lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.travel_agent_leads.count({
        where: { travelAgentId, nextFollowUp: { gte: todayStart, lt: weekFromNow } },
      }),
      prisma.travel_agent_tours.count({ where: { travelAgentId } }),
      prisma.travel_agent_tours.count({ where: { travelAgentId, isActive: true } }),
      prisma.travel_agent_properties.count({ where: { travelAgentId } }),
      prisma.travel_agent_properties.count({ where: { travelAgentId, isActive: true } }),
      // The app's "Your listings" grid reads dash.fleet — without these the
      // Fleet tile always said "0 total" no matter how many vehicles existed.
      (prisma as any).travel_agent_fleets.count({ where: { travelAgentId } }),
      (prisma as any).travel_agent_fleets.count({ where: { travelAgentId, isActive: true } }),
      prisma.travel_agent_bookings.count({ where: { travelAgentId } }),
      prisma.travel_agent_bookings.count({ where: { travelAgentId, status: 'CONFIRMED' } }),
      prisma.travel_agent_bookings.count({
        where: { travelAgentId, createdAt: { gte: monthStart } },
      }),
      prisma.travel_agent_bookings.aggregate({
        where: { travelAgentId, status: { in: ['CONFIRMED', 'COMPLETED'] } },
        _sum: { totalAmount: true, paidAmount: true },
      }),
    ]);

    const conversionRate = totalLeads > 0 ? Math.round((bookedLeads / totalLeads) * 100) : 0;

    return NextResponse.json({
      leads: {
        total: totalLeads,
        new: newLeads,
        hot: hotLeads,
        booked: bookedLeads,
        lost: lostLeads,
        thisMonth: thisMonthLeads,
        conversionRate,
      },
      followUps: {
        today: followUpsToday,
        thisWeek: followUpsThisWeek,
      },
      tours: {
        total: totalTours,
        active: activeTours,
      },
      properties: {
        total: totalProperties,
        active: activeProperties,
      },
      fleet: {
        total: totalFleet,
        active: activeFleet,
      },
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        thisMonth: thisMonthBookings,
        totalAmount: totalEarningsAgg._sum.totalAmount || 0,
        paidAmount: totalEarningsAgg._sum.paidAmount || 0,
      },
    });
  } catch (error: any) {
    logger.error('Travel agent dashboard error', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats', details: error?.message },
      { status: 500 },
    );
  }
}
