"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Star, Heart, MessageCircle, Eye, ArrowRight } from "lucide-react"

interface FeaturedRanking {
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
    imageUrl?: string
  }>
}

export default function FeaturedRankings() {
  const [rankings, setRankings] = useState<FeaturedRanking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedRankings()
  }, [])

  const fetchFeaturedRankings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/rankings/featured")
      const data = await response.json()
      setRankings(data.rankings)
    } catch (error) {
      console.error("Error fetching featured rankings:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
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
    )
  }

  if (rankings.length === 0) {
    return (
      <div className="text-center py-12">
        <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No featured rankings yet</p>
        <p className="text-gray-400 text-sm mt-1">
          Create some amazing rankings to get featured!
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Star className="h-6 w-6 mr-2 text-yellow-500" />
          Featured Rankings
        </h2>
        <Link
          href="/browse"
          className="flex items-center text-indigo-600 hover:text-indigo-500 font-medium"
        >
          View all
          <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rankings.map((ranking) => (
          <Link
            key={ranking.id}
            href={`/ranking/${ranking.id}`}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 group"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
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
              <span className="text-xs text-gray-500">
                {formatTimeAgo(ranking.createdAt)}
              </span>
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
    </div>
  )
}
