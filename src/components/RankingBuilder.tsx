"use client"

import { useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Plus, GripVertical, X } from "lucide-react"

interface RankingItem {
  id: string
  title: string
  description: string
  imageUrl?: string
}

interface RankingData {
  title: string
  description: string
  category: string
  isPublic: boolean
  allowComments: boolean
  items: RankingItem[]
}

export default function RankingBuilder() {
  const [rankingData, setRankingData] = useState<RankingData>({
    title: "",
    description: "",
    category: "",
    isPublic: true,
    allowComments: true,
    items: []
  })

  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    imageUrl: ""
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setRankingData((prev) => {
        const oldIndex = prev.items.findIndex((item) => item.id === active.id)
        const newIndex = prev.items.findIndex((item) => item.id === over?.id)

        return {
          ...prev,
          items: arrayMove(prev.items, oldIndex, newIndex).map((item, index) => ({
            ...item,
            position: index + 1
          }))
        }
      })
    }
  }

  const addItem = () => {
    if (!newItem.title.trim()) return

    const item: RankingItem = {
      id: `item-${Date.now()}`,
      title: newItem.title,
      description: newItem.description,
      imageUrl: newItem.imageUrl || undefined
    }

    setRankingData(prev => ({
      ...prev,
      items: [...prev.items, item]
    }))

    setNewItem({ title: "", description: "", imageUrl: "" })
  }

  const removeItem = (id: string) => {
    setRankingData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }))
  }

  const saveRanking = async () => {
    if (!rankingData.title.trim() || rankingData.items.length === 0) {
      alert("Please add a title and at least one item")
      return
    }

    try {
      const response = await fetch("/api/rankings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rankingData),
      })

      if (response.ok) {
        const data = await response.json()
        // Redirect to the created ranking
        window.location.href = `/ranking/${data.id}`
      } else {
        alert("Failed to save ranking")
      }
    } catch (error) {
      console.error("Error saving ranking:", error)
      alert("Failed to save ranking")
    }
  }

  return (
    <div className="space-y-8">
      {/* Basic Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title *
            </label>
            <input
              type="text"
              value={rankingData.title}
              onChange={(e) => setRankingData(prev => ({ ...prev, title: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., Top 10 Basketball Players of All Time"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={rankingData.description}
              onChange={(e) => setRankingData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Explain your ranking criteria and reasoning..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={rankingData.category}
              onChange={(e) => setRankingData(prev => ({ ...prev, category: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Select a category</option>
              <option value="sports">Sports</option>
              <option value="movies">Movies</option>
              <option value="music">Music</option>
              <option value="food">Food</option>
              <option value="travel">Travel</option>
              <option value="technology">Technology</option>
              <option value="books">Books</option>
              <option value="games">Games</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={rankingData.isPublic}
                onChange={(e) => setRankingData(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Make public</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={rankingData.allowComments}
                onChange={(e) => setRankingData(prev => ({ ...prev, allowComments: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Allow comments</span>
            </label>
          </div>
        </div>
      </div>

      {/* Add New Item */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Add Items</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Item Title *
              </label>
              <input
                type="text"
                value={newItem.title}
                onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., Michael Jordan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <input
                type="text"
                value={newItem.description}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., 6 championships, 5 MVPs"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Image URL
              </label>
              <input
                type="url"
                value={newItem.imageUrl}
                onChange={(e) => setNewItem(prev => ({ ...prev, imageUrl: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <button
            onClick={addItem}
            disabled={!newItem.title.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </button>
        </div>
      </div>

      {/* Ranking Items */}
      {rankingData.items.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Your Ranking ({rankingData.items.length} items)
          </h2>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={rankingData.items.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {rankingData.items.map((item, index) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    position={index + 1}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveRanking}
          disabled={!rankingData.title.trim() || rankingData.items.length === 0}
          className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Ranking
        </button>
      </div>
    </div>
  )
}

function SortableItem({ item, position, onRemove }: { 
  item: RankingItem
  position: number
  onRemove: (id: string) => void 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-200 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center space-x-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1"
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
              {position}
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-sm text-gray-500 truncate">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => onRemove(item.id)}
          className="text-gray-400 hover:text-red-500 p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
