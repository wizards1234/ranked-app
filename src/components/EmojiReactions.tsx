"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

interface Reaction {
  emoji: string
  count: number
  userReacted: boolean
}

interface EmojiReactionsProps {
  targetType: "ranking" | "comment" | "ranking_item"
  targetId: string
  initialReactions?: Reaction[]
}

const EMOJI_OPTIONS = [
  { emoji: "👍", label: "Like" },
  { emoji: "❤️", label: "Love" },
  { emoji: "😂", label: "Funny" },
  { emoji: "😮", label: "Wow" },
  { emoji: "😢", label: "Sad" },
  { emoji: "😡", label: "Angry" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "💯", label: "Perfect" },
]

export default function EmojiReactions({ 
  targetType, 
  targetId, 
  initialReactions = [] 
}: EmojiReactionsProps) {
  const { data: session } = useSession()
  const [reactions, setReactions] = useState<Reaction[]>(initialReactions)
  const [loading, setLoading] = useState(false)

  const toggleReaction = async (emoji: string) => {
    if (!session || loading) return

    setLoading(true)
    try {
      const response = await fetch(`/api/reactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetType,
          targetId,
          emoji
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update local state
        setReactions(prev => {
          const existingReaction = prev.find(r => r.emoji === emoji)
          
          if (existingReaction) {
            if (data.reacted) {
              // User just reacted
              return prev.map(r => 
                r.emoji === emoji 
                  ? { ...r, count: r.count + 1, userReacted: true }
                  : r
              )
            } else {
              // User removed reaction
              if (existingReaction.count === 1) {
                // Remove the reaction entirely
                return prev.filter(r => r.emoji !== emoji)
              } else {
                // Decrement count
                return prev.map(r => 
                  r.emoji === emoji 
                    ? { ...r, count: r.count - 1, userReacted: false }
                    : r
                )
              }
            }
          } else {
            // New reaction
            return [...prev, { emoji, count: 1, userReacted: true }]
          }
        })
      }
    } catch (error) {
      console.error("Error toggling reaction:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      {EMOJI_OPTIONS.map(({ emoji, label }) => {
        const reaction = reactions.find(r => r.emoji === emoji)
        const count = reaction?.count || 0
        const userReacted = reaction?.userReacted || false

        return (
          <button
            key={emoji}
            onClick={() => toggleReaction(emoji)}
            disabled={loading}
            className={`group relative flex items-center space-x-1 px-2 py-1 rounded-full text-sm transition-colors ${
              userReacted
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            title={label}
          >
            <span className="text-base">{emoji}</span>
            {count > 0 && (
              <span className="text-xs font-medium">{count}</span>
            )}
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              {label}
            </div>
          </button>
        )
      })}
    </div>
  )
}
