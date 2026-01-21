/**
 * Cursor-based Pagination Utility
 *
 * Provides efficient cursor-based pagination for large datasets.
 * Cursor pagination is more performant than offset pagination for large tables
 * because it uses indexed lookups instead of OFFSET which requires scanning.
 *
 * Usage:
 * ```typescript
 * import { paginateWithCursor, encodeCursor, decodeCursor } from '@/lib/db/pagination';
 *
 * // In API route
 * const { searchParams } = new URL(request.url);
 * const cursor = searchParams.get('cursor');
 * const limit = parseInt(searchParams.get('limit') || '20');
 *
 * const result = await paginateWithCursor(prisma.booking, {
 *   cursor,
 *   limit,
 *   where: { status: 'ACTIVE' },
 *   orderBy: { createdAt: 'desc' },
 * });
 *
 * // Returns: { items, nextCursor, hasMore }
 * ```
 */

/**
 * Cursor encoding/decoding
 * Encodes cursor as base64 JSON for safe URL transport
 */
export function encodeCursor(data: Record<string, any>): string {
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

export function decodeCursor(cursor: string): Record<string, any> | null {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * Paginated result type
 */
export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

/**
 * Pagination options
 */
export interface PaginationOptions<TOrderBy> {
  cursor?: string | null;
  limit?: number;
  where?: Record<string, any>;
  orderBy?: TOrderBy;
  include?: Record<string, any>;
  select?: Record<string, any>;
  includeTotal?: boolean;
}

/**
 * Generic cursor-based pagination function
 *
 * @param model Prisma model (e.g., prisma.booking)
 * @param options Pagination options
 * @returns Paginated result with items, cursor, and hasMore flag
 */
export async function paginateWithCursor<T, TOrderBy = Record<string, 'asc' | 'desc'>>(
  model: any,
  options: PaginationOptions<TOrderBy>
): Promise<PaginatedResult<T>> {
  const {
    cursor,
    limit = 20,
    where = {},
    orderBy = { createdAt: 'desc' } as TOrderBy,
    include,
    select,
    includeTotal = false,
  } = options;

  // Ensure limit is reasonable
  const safeLimit = Math.min(Math.max(1, limit), 100);

  // Build query options
  const queryOptions: any = {
    where,
    take: safeLimit + 1, // Take one extra to check if there are more
    orderBy,
  };

  // Add cursor if provided
  if (cursor) {
    const decodedCursor = decodeCursor(cursor);
    if (decodedCursor?.id) {
      queryOptions.cursor = { id: decodedCursor.id };
      queryOptions.skip = 1; // Skip the cursor item itself
    }
  }

  // Add include or select
  if (include) {
    queryOptions.include = include;
  } else if (select) {
    queryOptions.select = select;
  }

  // Execute queries
  const [items, total] = await Promise.all([
    model.findMany(queryOptions),
    includeTotal ? model.count({ where }) : Promise.resolve(undefined),
  ]);

  // Check if there are more items
  const hasMore = items.length > safeLimit;

  // Remove the extra item if present
  if (hasMore) {
    items.pop();
  }

  // Generate next cursor from last item
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor({ id: lastItem.id }) : null;

  return {
    items,
    nextCursor,
    hasMore,
    ...(includeTotal && { total }),
  };
}

/**
 * Helper to create paginated response
 */
export function createPaginatedResponse<T>(
  result: PaginatedResult<T>,
  additionalData?: Record<string, any>
) {
  return {
    success: true,
    data: result.items,
    pagination: {
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      ...(result.total !== undefined && { total: result.total }),
    },
    ...additionalData,
  };
}

/**
 * Parse pagination params from URL
 */
export function parsePaginationParams(searchParams: URLSearchParams) {
  return {
    cursor: searchParams.get('cursor') || undefined,
    limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100),
  };
}

/**
 * Offset-based pagination (for backward compatibility)
 * Less efficient but sometimes needed for UI page numbers
 */
export async function paginateWithOffset<T>(
  model: any,
  options: {
    page?: number;
    limit?: number;
    where?: Record<string, any>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    include?: Record<string, any>;
    select?: Record<string, any>;
  }
): Promise<{
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}> {
  const { page = 1, limit = 20, where = {}, orderBy = { createdAt: 'desc' }, include, select } = options;

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const skip = (safePage - 1) * safeLimit;

  const queryOptions: any = {
    where,
    take: safeLimit,
    skip,
    orderBy,
  };

  if (include) {
    queryOptions.include = include;
  } else if (select) {
    queryOptions.select = select;
  }

  const [items, total] = await Promise.all([model.findMany(queryOptions), model.count({ where })]);

  const totalPages = Math.ceil(total / safeLimit);

  return {
    items,
    page: safePage,
    limit: safeLimit,
    total,
    totalPages,
    hasMore: safePage < totalPages,
  };
}

export default {
  encodeCursor,
  decodeCursor,
  paginateWithCursor,
  paginateWithOffset,
  createPaginatedResponse,
  parsePaginationParams,
};
