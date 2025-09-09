import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "6")

    // Get rankings with high engagement (likes + comments + views)
    const rankings = await prisma.ranking.findMany({
      where: {
        isPublic: true,
        // Only consider rankings from the last 30 days for featured
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        items: {
          orderBy: { position: "asc" },
          take: 3 // Only get top 3 for preview
        },
        category: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        _count: {
          select: {
            comments: true,
            reactions: true
          }
        }
      },
      orderBy: [
        // Prioritize rankings with high engagement
        { likeCount: "desc" },
        { commentCount: "desc" },
        { viewCount: "desc" },
        { createdAt: "desc" }
      ],
      take: limit
    })

    // Transform to include like counts
    const featuredRankings = rankings.map(ranking => ({
      ...ranking,
      likeCount: ranking._count.reactions,
      commentCount: ranking._count.comments
    }))

    return NextResponse.json({ rankings: featuredRankings })
  } catch (error) {
    console.error("Error fetching featured rankings:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
