import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> | { vendorId: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const viewerId = auth.vendorId;
    const resolvedParams = 'then' in params ? await params : params;
    const targetId = resolvedParams.vendorId === 'me' ? viewerId : resolvedParams.vendorId;

    const vendor = await prisma.vendors.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        businessName: true,
        ownerName: true,
        logo: true,
        city: true,
        state: true,
        description: true,
        createdAt: true,
        vendor_approved_services: {
          where: { isActive: true },
          include: { services: { select: { id: true, name: true, slug: true } } },
        },
        vendor_fleets: {
          where: { isActive: true },
          take: 12,
          select: {
            id: true,
            vehicleName: true,
            registrationNumber: true,
            yearOfManufacture: true,
            fuelType: true,
            seatingCapacity: true,
            color: true,
            transmission: true,
            brands: { select: { name: true } },
            vehicle_models: { select: { name: true } },
            services: { select: { name: true } },
          },
        },
        _count: {
          select: {
            social_posts: true,
            social_follows_follower: true,
            social_follows_following: true,
            vendor_fleets: { where: { isActive: true } },
          },
        },
      },
    });

    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

    const isFollowing = viewerId !== targetId
      ? !!(await prisma.social_follows.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: targetId } },
        }))
      : false;

    // Recent posts
    const posts = await prisma.social_posts.findMany({
      where: { vendorId: targetId, isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        category: { select: { id: true, name: true, isSOS: true } },
        _count: { select: { social_post_likes: true, social_post_comments: true } },
        social_post_likes: { where: { vendorId: viewerId }, select: { id: true } },
        social_post_saves: { where: { vendorId: viewerId }, select: { id: true } },
      },
    });

    const enrichedPosts = posts.map((p) => ({
      ...p,
      likedByMe: p.social_post_likes.length > 0,
      savedByMe: p.social_post_saves.length > 0,
      likesCount: p._count.social_post_likes,
      commentsCount: p._count.social_post_comments,
    }));

    const fleet = vendor.vendor_fleets.map((v) => ({
      id: v.id,
      vehicleName: v.vehicleName,
      registrationNumber: v.registrationNumber,
      year: v.yearOfManufacture,     // normalize for frontend (reads item.year)
      fuelType: v.fuelType,
      seatingCapacity: v.seatingCapacity,
      color: v.color,
      transmission: v.transmission,
      brands: v.brands,
      vehicle_models: v.vehicle_models,
      services: v.services,
      status: 'active',
    }));

    return NextResponse.json({
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        ownerName: vendor.ownerName,
        logo: vendor.logo,
        city: vendor.city,
        state: vendor.state,
        description: vendor.description,
        createdAt: vendor.createdAt,
        vendor_approved_services: vendor.vendor_approved_services,
        postsCount: vendor._count.social_posts,
        followersCount: vendor._count.social_follows_following,
        followingCount: vendor._count.social_follows_follower,
        fleetsCount: vendor._count.vendor_fleets,
        isMe: viewerId === targetId,
        isFollowing,
      },
      posts: enrichedPosts,
      fleet,
    });
  } catch (error: any) {
    logger.error('Get vendor social profile error', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
