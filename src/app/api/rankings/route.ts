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

    const { title, description, category, isPublic, allowComments, items } = await request.json()

    // Validate input
    if (!title || !items || items.length === 0) {
      return NextResponse.json(
        { message: "Title and at least one item are required" },
        { status: 400 }
      )
    }

    // Get or create category
    let categoryId: string
    if (category) {
      const existingCategory = await prisma.category.findUnique({
        where: { slug: category.toLowerCase() }
      })
      
      if (existingCategory) {
        categoryId = existingCategory.id
      } else {
        const newCategory = await prisma.category.create({
          data: {
            name: category.charAt(0).toUpperCase() + category.slice(1),
            slug: category.toLowerCase(),
            description: `Rankings about ${category}`,
          }
        })
        categoryId = newCategory.id
      }
    } else {
      // Default to "Other" category
      const otherCategory = await prisma.category.findUnique({
        where: { slug: "other" }
      })
      
      if (otherCategory) {
        categoryId = otherCategory.id
      } else {
        const newCategory = await prisma.category.create({
          data: {
            name: "Other",
            slug: "other",
            description: "Miscellaneous rankings",
          }
        })
        categoryId = newCategory.id
      }
    }

    // Create ranking
    const ranking = await prisma.ranking.create({
      data: {
        title,
        description,
        categoryId,
        isPublic,
        allowComments,
        userId: session.user.id,
        items: {
          create: items.map((item: any, index: number) => ({
            position: index + 1,
            title: item.title,
            description: item.description,
            imageUrl: item.imageUrl,
            metadata: {}
          }))
        }
      },
      include: {
        items: true,
        category: true,
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

    return NextResponse.json(ranking, { status: 201 })
  } catch (error) {
    console.error("Error creating ranking:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    const where: any = {
      isPublic: true
    }

    if (category) {
      where.category = {
        slug: category
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ]
    }

    const rankings = await prisma.ranking.findMany({
      where,
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
      },
      orderBy: {
        createdAt: "desc"
      },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.ranking.count({ where })

    return NextResponse.json({
      rankings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching rankings:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
