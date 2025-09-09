"use client"

import { useState } from "react"
import { Heart, MessageCircle, Share2, Eye } from "lucide-react"
import CommentsSection from "./CommentsSection"
import EmojiReactions from "./EmojiReactions"

interface RankingItem {
  id: string
  position: number
  title: string
  description?: string
  imageUrl?: string
  metadata?: any
}

interface Ranking {
  id: string
  title: string
  description?: string
  isPublic: boolean
  allowComments: boolean
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
  items: RankingItem[]
  category: {
    id: string
    name: string
    slug: string
  }
  user: {
    id: string
    username: string
    displayName?: string
    avatarUrl?: string
  }
}

interface RankingDisplayProps {
  ranking: Ranking
  showActions?: boolean
  showComments?: boolean
}

export default function RankingDisplay({ ranking, showActions = true, showComments = true }: RankingDisplayProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(ranking.likeCount)

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/rankings/${ranking.id}/like`, {
        method: "POST",
      })

      if (response.ok) {
        setIsLiked(!isLiked)
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
      }
    } catch (error) {
      console.error("Error liking ranking:", error)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: ranking.title,
          text: ranking.description,
          url: window.location.href,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{ranking.title}</h1>
            {ranking.description && (
              <p className="mt-2 text-gray-600">{ranking.description}</p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {ranking.category.name}
            </span>
          </div>
        </div>

        {/* User info */}
        <div className="mt-4 flex items-center space-x-3">
          <div className="flex-shrink-0">
            {ranking.user.avatarUrl ? (
              <img
                className="h-8 w-8 rounded-full"
                src={ranking.user.avatarUrl}
                alt={ranking.user.displayName || ranking.user.username}
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {(ranking.user.displayName || ranking.user.username).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {ranking.user.displayName || ranking.user.username}
            </p>
            <p className="text-sm text-gray-500">
              {new Date(ranking.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Ranking Items */}
      <div className="px-6 py-4">
        <div className="space-y-4">
          {ranking.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-shrink-0">
                <span className="flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-full text-lg font-bold">
                  {item.position}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="mt-1 text-gray-600">{item.description}</p>
                )}
              </div>

              {item.imageUrl && (
                <div className="flex-shrink-0">
                  <img
                    className="h-16 w-16 object-cover rounded-lg"
                    src={item.imageUrl}
                    alt={item.title}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isLiked
                    ? "text-red-600 bg-red-50"
                    : "text-gray-500 hover:text-red-600 hover:bg-red-50"
                }`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                <span>{likeCount}</span>
              </button>

              <button className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                <MessageCircle className="h-4 w-4" />
                <span>{ranking.commentCount}</span>
              </button>

              <div className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-500">
                <Eye className="h-4 w-4" />
                <span>{ranking.viewCount}</span>
              </div>
            </div>

            <button
              onClick={handleShare}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>

          {/* Emoji Reactions */}
          <div className="mt-4">
            <EmojiReactions
              targetType="ranking"
              targetId={ranking.id}
            />
          </div>
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="mt-6">
          <CommentsSection
            rankingId={ranking.id}
            allowComments={ranking.allowComments}
          />
        </div>
      )}
    </div>
  )
}
