import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeFilter = searchParams.get("timeFilter") || "week"
    const limit = parseInt(searchParams.get("limit") || "10")

    // Calculate date filter
    const now = new Date()
    let dateFilter: Date

    switch (timeFilter) {
      case "today":
        dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case "week":
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "month":
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "all":
      default:
        dateFilter = new Date(0) // Beginning of time
        break
    }

    // Get rankings with engagement metrics
    const rankings = await prisma.ranking.findMany({
      where: {
        isPublic: true,
        createdAt: {
          gte: dateFilter
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
      orderBy: {
        createdAt: "desc"
      },
      take: limit * 2 // Get more to calculate trending score
    })

    // Calculate trending score for each ranking
    const rankingsWithScore = rankings.map(ranking => {
      const hoursSinceCreated = (now.getTime() - ranking.createdAt.getTime()) / (1000 * 60 * 60)
      const engagementScore = ranking.likeCount + (ranking.commentCount * 2) + (ranking.viewCount * 0.1)
      
      // Trending algorithm: higher engagement + recency = higher score
      // Penalize older content, boost recent content
      const recencyMultiplier = Math.max(0.1, 1 - (hoursSinceCreated / (24 * 7))) // Decay over a week
      const trendingScore = engagementScore * recencyMultiplier

      return {
        ...ranking,
        likeCount: ranking._count.reactions,
        commentCount: ranking._count.comments,
        trendingScore
      }
    })

    // Sort by trending score and take the requested limit
    const trendingRankings = rankingsWithScore
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit)
      .map(({ trendingScore, ...ranking }) => ranking) // Remove trendingScore from response

    return NextResponse.json({ rankings: trendingRankings })
  } catch (error) {
    console.error("Error fetching trending rankings:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
