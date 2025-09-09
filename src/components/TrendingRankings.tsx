"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { TrendingUp, Clock, Heart, MessageCircle, Eye } from "lucide-react"

interface TrendingRanking {
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
  trendingScore?: number
}

interface TrendingRankingsProps {
  timeFilter?: "today" | "week" | "month" | "all"
  limit?: number
}

export default function TrendingRankings({ 
  timeFilter = "week", 
  limit = 10 
}: TrendingRankingsProps) {
  const [rankings, setRankings] = useState<TrendingRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState(timeFilter)

  useEffect(() => {
    fetchTrendingRankings()
  }, [selectedFilter, limit])

  const fetchTrendingRankings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/rankings/trending?timeFilter=${selectedFilter}&limit=${limit}`)
      const data = await response.json()
      setRankings(data.rankings)
    } catch (error) {
      console.error("Error fetching trending rankings:", error)
    } finally {
      setLoading(false)
    }
  }

  const timeFilters = [
    { value: "today", label: "Today", icon: Clock },
    { value: "week", label: "This Week", icon: TrendingUp },
    { value: "month", label: "This Month", icon: TrendingUp },
    { value: "all", label: "All Time", icon: TrendingUp },
  ]

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
            Trending Rankings
          </h2>
          
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {timeFilters.map((filter) => {
              const Icon = filter.icon
              return (
                <button
                  key={filter.value}
                  onClick={() => setSelectedFilter(filter.value as any)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    selectedFilter === filter.value
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{filter.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : rankings.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No trending rankings found</p>
            <p className="text-gray-400 text-sm mt-1">
              Check back later for popular content
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {rankings.map((ranking, index) => (
              <div
                key={ranking.id}
                className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {/* Rank */}
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? "bg-yellow-500 text-white" :
                    index === 1 ? "bg-gray-400 text-white" :
                    index === 2 ? "bg-orange-500 text-white" :
                    "bg-indigo-100 text-indigo-700"
                  }`}>
                    {index + 1}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/ranking/${ranking.id}`}
                    className="block hover:text-indigo-600 transition-colors"
                  >
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {ranking.title}
                    </h3>
                    {ranking.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                        {ranking.description}
                      </p>
                    )}
                  </Link>

                  {/* Top 3 items preview */}
                  <div className="mt-2 space-y-1">
                    {ranking.items.slice(0, 3).map((item) => (
                      <div key={item.position} className="flex items-center space-x-2 text-xs text-gray-600">
                        <span className="w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {item.position}
                        </span>
                        <span className="truncate">{item.title}</span>
                      </div>
                    ))}
                    {ranking.items.length > 3 && (
                      <p className="text-xs text-gray-500 ml-6">
                        +{ranking.items.length - 3} more items
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center space-x-3 text-xs text-gray-500 mb-2">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>{ranking.viewCount}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="h-3 w-3" />
                      <span>{ranking.likeCount}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="h-3 w-3" />
                      <span>{ranking.commentCount}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {ranking.category.name}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatTimeAgo(ranking.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
