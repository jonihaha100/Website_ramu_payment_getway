import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { mockReviews } from '../../../data/mockReviews';

const globalCache = globalThis as unknown as {
  __cachedReviews?: any[];
  __lastReviewsFetchTime?: number;
};

const CACHE_TTL_MS = 60000; // 60 seconds

// GET /api/reviews
export async function GET() {
  const cached = globalCache.__cachedReviews;
  const lastTime = globalCache.__lastReviewsFetchTime || 0;

  // 1. Instant Cache Hit: Return immediately in < 1ms if cached within TTL
  if (cached && cached.length > 0 && (Date.now() - lastTime < CACHE_TTL_MS)) {
    return NextResponse.json(cached, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  }

  try {
    // 2. Fast timeout race to prevent slow remote DB queries from blocking the UI
    const fetchPromise = prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to recent 50 reviews to ensure small payload
    });
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Review DB connection timeout')), 800)
    );
    
    const reviews = await Promise.race([fetchPromise, timeoutPromise]) as any[];
    globalCache.__cachedReviews = reviews;
    globalCache.__lastReviewsFetchTime = Date.now();

    return NextResponse.json(reviews, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    const fallbackData = (cached && cached.length > 0) ? cached : mockReviews;
    return NextResponse.json(fallbackData, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  }
}

// POST /api/reviews (Create a new review)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const newReview = await prisma.review.create({
      data: {
        orderId: body.orderId,
        productId: body.productId,
        productName: body.productName,
        customerName: body.customerName,
        rating: body.rating,
        comment: body.comment,
        photos: body.photos || []
      }
    });
    
    // Invalidate cache
    globalCache.__cachedReviews = undefined;
    globalCache.__lastReviewsFetchTime = 0;

    return NextResponse.json({ message: 'Review added successfully', review: newReview }, { status: 201 });
  } catch (error) {
    console.error("Failed to add review:", error);
    return NextResponse.json({ error: 'Failed to add review' }, { status: 500 });
  }
}

// PUT /api/reviews (Update an existing review)
export async function PUT(request: Request) {
  try {
    const updatedReview = await request.json();
    
    const review = await prisma.review.update({
      where: { id: updatedReview.id },
      data: {
        rating: updatedReview.rating,
        comment: updatedReview.comment,
        reply: updatedReview.reply
      }
    });

    // Invalidate cache
    globalCache.__cachedReviews = undefined;
    globalCache.__lastReviewsFetchTime = 0;

    return NextResponse.json({ message: 'Review updated successfully', review });
  } catch (error) {
    console.error("Failed to update review:", error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

// DELETE /api/reviews (Delete a review)
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    
    await prisma.review.delete({
      where: { id }
    });
    
    // Invalidate cache
    globalCache.__cachedReviews = undefined;
    globalCache.__lastReviewsFetchTime = 0;
    
    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error("Failed to delete review:", error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
