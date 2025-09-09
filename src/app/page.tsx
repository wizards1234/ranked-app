import Navigation from "@/components/Navigation"
import FeaturedRankings from "@/components/FeaturedRankings"
import TrendingRankings from "@/components/TrendingRankings"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Rank Everything
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Create and share your top 10 lists. Discover what others are ranking. 
            Debate, discuss, and connect over your favorite things.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <a
                href="/create"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
              >
                Create Your First Ranking
              </a>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <a
                href="/browse"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                Browse Rankings
              </a>
            </div>
          </div>
        </div>

        {/* Featured Rankings */}
        <div className="mt-16">
          <FeaturedRankings />
        </div>

        {/* Trending Rankings */}
        <div className="mt-16">
          <TrendingRankings limit={5} />
        </div>

        {/* Popular Categories */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Popular Categories
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Sports", icon: "🏀", count: "1,234 rankings" },
              { name: "Movies", icon: "🎬", count: "2,156 rankings" },
              { name: "Music", icon: "🎵", count: "1,890 rankings" },
              { name: "Food", icon: "🍕", count: "987 rankings" },
              { name: "Travel", icon: "✈️", count: "654 rankings" },
              { name: "Technology", icon: "💻", count: "432 rankings" },
            ].map((category) => (
              <div
                key={category.name}
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
              >
                <div className="flex-shrink-0">
                  <span className="text-2xl">{category.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <a href={`/category/${category.name.toLowerCase()}`} className="focus:outline-none">
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-sm font-medium text-gray-900">{category.name}</p>
                    <p className="text-sm text-gray-500">{category.count}</p>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}