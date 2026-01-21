import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

type KnowledgeBaseItem = Awaited<
  ReturnType<typeof prisma.knowledge_base.findMany>
>[number];

// POST - Search knowledge base (public endpoint for Shivi)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, category } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const queryLower = query.toLowerCase();

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (category) {
      where.chauffeur_vehicle_categories = category;
    }

    // Fetch all active items
    const allItems: KnowledgeBaseItem[] = await prisma.knowledge_base.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { useCount: 'desc' },
      ],
    });

    // Score and filter items based on relevance
    const scoredItems = allItems
      .map((item: KnowledgeBaseItem) => {
        let score = 0;

        // Exact question match (highest score)
        if (item.question.toLowerCase() === queryLower) {
          score += 100;
        }

        // Question contains query
        if (item.question.toLowerCase().includes(queryLower)) {
          score += 50;
        }

        // Query contains question words
        const questionWords = item.question.toLowerCase().split(' ');
        const queryWords = queryLower.split(' ');
        const matchingWords = queryWords.filter((word: string) =>
          questionWords.some((qWord: string) => qWord.includes(word) || word.includes(qWord))
        );
        score += matchingWords.length * 10;

        // Keyword matches
        if (item.keywords && Array.isArray(item.keywords)) {
          (item.keywords as string[]).forEach((keyword) => {
            if (queryLower.includes(keyword.toLowerCase())) {
              score += 30;
            }
          });
        }

        // Answer contains query (lower score)
        if (item.answer.toLowerCase().includes(queryLower)) {
          score += 5;
        }

        // Add priority bonus
        score += item.priority * 2;

        return { ...item, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    // Return top 5 results
    const results = scoredItems.slice(0, 5).map(({ score, ...item }) => item);

    return NextResponse.json({
      results,
      count: results.length,
    });
  } catch (error) {
    logger.error('Error searching knowledge base', error);
    return NextResponse.json(
      { error: 'Failed to search knowledge base' },
      { status: 500 }
    );
  }
}

// Increment use count
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.knowledge_base.update({
      where: { id },
      data: {
        useCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error incrementing use count', error);
    return NextResponse.json(
      { error: 'Failed to update use count' },
      { status: 500 }
    );
  }
}
