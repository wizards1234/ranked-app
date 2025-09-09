import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const comments = await prisma.comment.findMany({
      where: {
        rankingId: params.id,
        isDeleted: false,
        parentId: null // Only get top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        replies: {
          where: { isDeleted: false },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true
              }
            }
          },
          orderBy: { createdAt: "asc" }
        },
        _count: {
          select: {
            reactions: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Transform to include like counts
    const commentsWithCounts = comments.map(comment => ({
      ...comment,
      likeCount: comment._count.reactions,
      replies: comment.replies.map(reply => ({
        ...reply,
        likeCount: 0 // We'd need to fetch this separately for replies
      }))
    }))

    return NextResponse.json({ comments: commentsWithCounts })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { content, parentId } = await request.json()

    if (!content || !content.trim()) {
      return NextResponse.json(
        { message: "Content is required" },
        { status: 400 }
      )
    }

    // Check if ranking exists and allows comments
    const ranking = await prisma.ranking.findUnique({
      where: { id: params.id },
      select: { allowComments: true }
    })

    if (!ranking) {
      return NextResponse.json(
        { message: "Ranking not found" },
        { status: 404 }
      )
    }

    if (!ranking.allowComments) {
      return NextResponse.json(
        { message: "Comments are disabled for this ranking" },
        { status: 403 }
      )
    }

    // If it's a reply, check if parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId }
      })

      if (!parentComment) {
        return NextResponse.json(
          { message: "Parent comment not found" },
          { status: 404 }
        )
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        rankingId: params.id,
        userId: session.user.id,
        parentId: parentId || null
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    })

    // Update comment count on ranking
    await prisma.ranking.update({
      where: { id: params.id },
      data: { commentCount: { increment: 1 } }
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
