"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Navigation from "@/components/Navigation"
import { Eye, Heart, MessageCircle, Calendar } from "lucide-react"

interface Ranking {
  id: string
  title: string
  description?: string
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
  category: {
    name: string
    slug: string
  }
  user: {
    username: string
    displayName?: string
    avatarUrl?: string
  }
  items: Array<{
    position: number
    title: string
  }>
}

export default function BrowsePage() {
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState("")
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchRankings()
  }, [category, search])

  const fetchRankings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (category) params.append("category", category)
      if (search) params.append("search", search)
      
      const response = await fetch(`/api/rankings?${params}`)
      const data = await response.json()
      setRankings(data.rankings)
    } catch (error) {
      console.error("Error fetching rankings:", error)
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { name: "All", slug: "" },
    { name: "Sports", slug: "sports" },
    { name: "Movies", slug: "movies" },
    { name: "Music", slug: "music" },
    { name: "Food", slug: "food" },
    { name: "Travel", slug: "travel" },
    { name: "Technology", slug: "technology" },
    { name: "Books", slug: "books" },
    { name: "Games", slug: "games" },
    { name: "Other", slug: "other" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Rankings</h1>
          <p className="mt-2 text-gray-600">
            Discover what others are ranking and sharing
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setCategory(cat.slug)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === cat.slug
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="max-w-md">
            <input
              type="text"
              placeholder="Search rankings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Rankings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : rankings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No rankings found</p>
            <p className="text-gray-400 mt-2">
              Try adjusting your filters or create the first ranking!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rankings.map((ranking) => (
              <Link
                key={ranking.id}
                href={`/ranking/${ranking.id}`}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {ranking.title}
                  </h3>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 ml-2 flex-shrink-0">
                    {ranking.category.name}
                  </span>
                </div>

                {ranking.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {ranking.description}
                  </p>
                )}

                {/* Top 3 items preview */}
                <div className="space-y-2 mb-4">
                  {ranking.items.slice(0, 3).map((item) => (
                    <div key={item.position} className="flex items-center space-x-2 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {item.position}
                      </span>
                      <span className="text-gray-700 truncate">{item.title}</span>
                    </div>
                  ))}
                  {ranking.items.length > 3 && (
                    <p className="text-xs text-gray-500 ml-8">
                      +{ranking.items.length - 3} more items
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{ranking.viewCount}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="h-4 w-4" />
                      <span>{ranking.likeCount}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{ranking.commentCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(ranking.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* User */}
                <div className="mt-4 flex items-center space-x-2">
                  {ranking.user.avatarUrl ? (
                    <img
                      className="h-6 w-6 rounded-full"
                      src={ranking.user.avatarUrl}
                      alt={ranking.user.displayName || ranking.user.username}
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">
                        {(ranking.user.displayName || ranking.user.username).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm text-gray-600">
                    {ranking.user.displayName || ranking.user.username}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
