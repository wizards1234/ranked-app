import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

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

    const commentId = params.id

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    })

    if (!comment) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 }
      )
    }

    // Check if user already liked this comment
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        userId_targetType_targetId_emoji: {
          userId: session.user.id,
          targetType: "comment",
          targetId: commentId,
          emoji: "❤️"
        }
      }
    })

    if (existingReaction) {
      // Unlike - remove the reaction
      await prisma.reaction.delete({
        where: {
          userId_targetType_targetId_emoji: {
            userId: session.user.id,
            targetType: "comment",
            targetId: commentId,
            emoji: "❤️"
          }
        }
      })

      // Decrement like count
      await prisma.comment.update({
        where: { id: commentId },
        data: { likeCount: { decrement: 1 } }
      })

      return NextResponse.json({ liked: false })
    } else {
      // Like - add the reaction
      await prisma.reaction.create({
        data: {
          userId: session.user.id,
          targetType: "comment",
          targetId: commentId,
          emoji: "❤️"
        }
      })

      // Increment like count
      await prisma.comment.update({
        where: { id: commentId },
        data: { likeCount: { increment: 1 } }
      })

      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error("Error toggling comment like:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
