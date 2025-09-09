import { notFound } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import Navigation from "@/components/Navigation"
import RankingDisplay from "@/components/RankingDisplay"

const prisma = new PrismaClient()

interface PageProps {
  params: {
    id: string
  }
}

export default async function RankingPage({ params }: PageProps) {
  const ranking = await prisma.ranking.findUnique({
    where: {
      id: params.id,
      isPublic: true
    },
    include: {
      items: {
        orderBy: { position: "asc" }
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
    }
  })

  if (!ranking) {
    notFound()
  }

  // Increment view count
  await prisma.ranking.update({
    where: { id: params.id },
    data: { viewCount: { increment: 1 } }
  })

  const rankingWithCounts = {
    ...ranking,
    likeCount: ranking._count.reactions,
    commentCount: ranking._count.comments
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <RankingDisplay ranking={rankingWithCounts} />
      </main>
    </div>
  )
}
