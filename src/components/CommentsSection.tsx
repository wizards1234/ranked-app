"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Heart, Reply, MoreHorizontal } from "lucide-react"

interface Comment {
  id: string
  content: string
  createdAt: string
  likeCount: number
  user: {
    id: string
    username: string
    displayName?: string
    avatarUrl?: string
  }
  replies?: Comment[]
  parentId?: string
}

interface CommentsSectionProps {
  rankingId: string
  allowComments: boolean
}

export default function CommentsSection({ rankingId, allowComments }: CommentsSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")

  useEffect(() => {
    fetchComments()
  }, [rankingId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/rankings/${rankingId}/comments`)
      const data = await response.json()
      setComments(data.comments)
    } catch (error) {
      console.error("Error fetching comments:", error)
    } finally {
      setLoading(false)
    }
  }

  const submitComment = async (content: string, parentId?: string) => {
    if (!session || !content.trim()) return

    try {
      const response = await fetch(`/api/rankings/${rankingId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          parentId
        }),
      })

      if (response.ok) {
        setNewComment("")
        setReplyingTo(null)
        setReplyText("")
        fetchComments()
      }
    } catch (error) {
      console.error("Error submitting comment:", error)
    }
  }

  const likeComment = async (commentId: string) => {
    if (!session) return

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
      })

      if (response.ok) {
        fetchComments()
      }
    } catch (error) {
      console.error("Error liking comment:", error)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  if (!allowComments) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">Comments are disabled for this ranking</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Comments ({comments.length})
        </h3>
      </div>

      <div className="p-6">
        {/* New Comment Form */}
        {session ? (
          <div className="mb-6">
            <div className="flex space-x-3">
              <div className="flex-shrink-0">
                {session.user?.image ? (
                  <img
                    className="h-8 w-8 rounded-full"
                    src={session.user.image}
                    alt={session.user.name || "User"}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {(session.user?.name || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts on this ranking..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  rows={3}
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => submitComment(newComment)}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              <a href="/auth/signin" className="text-indigo-600 hover:text-indigo-500">
                Sign in
              </a>{" "}
              to join the discussion
            </p>
          </div>
        )}

        {/* Comments List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex space-x-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={(parentId) => {
                  setReplyingTo(parentId)
                  setReplyText("")
                }}
                onLike={likeComment}
                formatTimeAgo={formatTimeAgo}
                session={session}
              />
            ))}
          </div>
        )}

        {/* Reply Form */}
        {replyingTo && (
          <div className="mt-4 pl-11">
            <div className="flex space-x-3">
              <div className="flex-shrink-0">
                {session?.user?.image ? (
                  <img
                    className="h-6 w-6 rounded-full"
                    src={session.user.image}
                    alt={session.user.name || "User"}
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-700">
                      {(session?.user?.name || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  rows={2}
                />
                <div className="mt-2 flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setReplyingTo(null)
                      setReplyText("")
                    }}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => submitComment(replyText, replyingTo)}
                    disabled={!replyText.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CommentItem({ 
  comment, 
  onReply, 
  onLike, 
  formatTimeAgo, 
  session 
}: { 
  comment: Comment
  onReply: (parentId: string) => void
  onLike: (commentId: string) => void
  formatTimeAgo: (date: string) => string
  session: any
}) {
  const [isLiked, setIsLiked] = useState(false)

  const handleLike = () => {
    onLike(comment.id)
    setIsLiked(!isLiked)
  }

  return (
    <div>
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          {comment.user.avatarUrl ? (
            <img
              className="h-8 w-8 rounded-full"
              src={comment.user.avatarUrl}
              alt={comment.user.displayName || comment.user.username}
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {(comment.user.displayName || comment.user.username).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-900">
              {comment.user.displayName || comment.user.username}
            </p>
            <p className="text-sm text-gray-500">
              {formatTimeAgo(comment.createdAt)}
            </p>
          </div>
          <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
            {comment.content}
          </p>
          <div className="mt-2 flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 text-sm ${
                isLiked ? "text-red-600" : "text-gray-500 hover:text-red-600"
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              <span>{comment.likeCount}</span>
            </button>
            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <Reply className="h-4 w-4" />
              <span>Reply</span>
            </button>
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 ml-11 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onLike={onLike}
              formatTimeAgo={formatTimeAgo}
              session={session}
            />
          ))}
        </div>
      )}
    </div>
  )
}
