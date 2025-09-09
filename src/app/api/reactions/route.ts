import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { targetType, targetId, emoji } = await request.json()

    if (!targetType || !targetId || !emoji) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate targetType
    if (!["ranking", "comment", "ranking_item"].includes(targetType)) {
      return NextResponse.json(
        { message: "Invalid target type" },
        { status: 400 }
      )
    }

    // Check if target exists
    let targetExists = false
    switch (targetType) {
      case "ranking":
        targetExists = !!(await prisma.ranking.findUnique({ where: { id: targetId } }))
        break
      case "comment":
        targetExists = !!(await prisma.comment.findUnique({ where: { id: targetId } }))
        break
      case "ranking_item":
        targetExists = !!(await prisma.rankingItem.findUnique({ where: { id: targetId } }))
        break
    }

    if (!targetExists) {
      return NextResponse.json(
        { message: "Target not found" },
        { status: 404 }
      )
    }

    // Check if user already reacted with this emoji
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        userId_targetType_targetId_emoji: {
          userId: session.user.id,
          targetType,
          targetId,
          emoji
        }
      }
    })

    if (existingReaction) {
      // Remove reaction
      await prisma.reaction.delete({
        where: {
          userId_targetType_targetId_emoji: {
            userId: session.user.id,
            targetType,
            targetId,
            emoji
          }
        }
      })

      // Update like count if it's a like reaction
      if (emoji === "❤️") {
        switch (targetType) {
          case "ranking":
            await prisma.ranking.update({
              where: { id: targetId },
              data: { likeCount: { decrement: 1 } }
            })
            break
          case "comment":
            await prisma.comment.update({
              where: { id: targetId },
              data: { likeCount: { decrement: 1 } }
            })
            break
        }
      }

      return NextResponse.json({ reacted: false })
    } else {
      // Add reaction
      await prisma.reaction.create({
        data: {
          userId: session.user.id,
          targetType,
          targetId,
          emoji
        }
      })

      // Update like count if it's a like reaction
      if (emoji === "❤️") {
        switch (targetType) {
          case "ranking":
            await prisma.ranking.update({
              where: { id: targetId },
              data: { likeCount: { increment: 1 } }
            })
            break
          case "comment":
            await prisma.comment.update({
              where: { id: targetId },
              data: { likeCount: { increment: 1 } }
            })
            break
        }
      }

      return NextResponse.json({ reacted: true })
    }
  } catch (error) {
    console.error("Error toggling reaction:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const targetType = searchParams.get("targetType")
    const targetId = searchParams.get("targetId")

    if (!targetType || !targetId) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      )
    }

    const reactions = await prisma.reaction.findMany({
      where: {
        targetType: targetType as "ranking" | "comment" | "ranking_item",
        targetId
      },
      select: {
        emoji: true,
        userId: true
      }
    })

    // Group by emoji and count
    const reactionCounts = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = { emoji: reaction.emoji, count: 0, userReacted: false }
      }
      acc[reaction.emoji].count++
      return acc
    }, {} as Record<string, { emoji: string; count: number; userReacted: boolean }>)

    return NextResponse.json({ reactions: Object.values(reactionCounts) })
  } catch (error) {
    console.error("Error fetching reactions:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
