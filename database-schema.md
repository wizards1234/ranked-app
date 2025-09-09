# Ranked App - Database Schema Design

## Core Entities

### Users
```sql
users {
  id: UUID (Primary Key)
  username: VARCHAR(50) UNIQUE
  email: VARCHAR(255) UNIQUE
  display_name: VARCHAR(100)
  avatar_url: VARCHAR(500)
  bio: TEXT
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
  is_verified: BOOLEAN DEFAULT false
}
```

### Categories
```sql
categories {
  id: UUID (Primary Key)
  name: VARCHAR(100) UNIQUE
  slug: VARCHAR(100) UNIQUE
  description: TEXT
  icon: VARCHAR(100)
  color: VARCHAR(7) -- hex color
  created_at: TIMESTAMP
}
```

### Rankings
```sql
rankings {
  id: UUID (Primary Key)
  user_id: UUID (Foreign Key -> users.id)
  category_id: UUID (Foreign Key -> categories.id)
  title: VARCHAR(200)
  description: TEXT
  is_public: BOOLEAN DEFAULT true
  allow_comments: BOOLEAN DEFAULT true
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
  view_count: INTEGER DEFAULT 0
  like_count: INTEGER DEFAULT 0
  comment_count: INTEGER DEFAULT 0
}
```

### Ranking Items
```sql
ranking_items {
  id: UUID (Primary Key)
  ranking_id: UUID (Foreign Key -> rankings.id)
  position: INTEGER -- 1, 2, 3, etc.
  title: VARCHAR(200)
  description: TEXT
  image_url: VARCHAR(500)
  external_url: VARCHAR(500) -- link to external resource
  metadata: JSONB -- flexible data for different item types
  created_at: TIMESTAMP
}
```

### Comments
```sql
comments {
  id: UUID (Primary Key)
  ranking_id: UUID (Foreign Key -> rankings.id)
  user_id: UUID (Foreign Key -> users.id)
  parent_id: UUID (Foreign Key -> comments.id) -- for threaded comments
  content: TEXT
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
  like_count: INTEGER DEFAULT 0
  is_deleted: BOOLEAN DEFAULT false
}
```

### Reactions
```sql
reactions {
  id: UUID (Primary Key)
  user_id: UUID (Foreign Key -> users.id)
  target_type: ENUM('ranking', 'comment', 'ranking_item')
  target_id: UUID -- polymorphic reference
  emoji: VARCHAR(10) -- emoji unicode
  created_at: TIMESTAMP
  UNIQUE(user_id, target_type, target_id, emoji)
}
```

### Follows
```sql
follows {
  id: UUID (Primary Key)
  follower_id: UUID (Foreign Key -> users.id)
  following_id: UUID (Foreign Key -> users.id)
  created_at: TIMESTAMP
  UNIQUE(follower_id, following_id)
}
```

### Tags
```sql
tags {
  id: UUID (Primary Key)
  name: VARCHAR(50) UNIQUE
  slug: VARCHAR(50) UNIQUE
  usage_count: INTEGER DEFAULT 0
  created_at: TIMESTAMP
}
```

### Ranking Tags (Many-to-Many)
```sql
ranking_tags {
  ranking_id: UUID (Foreign Key -> rankings.id)
  tag_id: UUID (Foreign Key -> tags.id)
  PRIMARY KEY (ranking_id, tag_id)
}
```

## Key Relationships

1. **Users** can create multiple **Rankings**
2. **Rankings** belong to a **Category** and have multiple **Ranking Items**
3. **Ranking Items** are ordered by position within a ranking
4. **Comments** can be threaded (replies to comments)
5. **Reactions** are polymorphic (can react to rankings, comments, or items)
6. **Users** can follow other users
7. **Rankings** can have multiple **Tags**

## Indexes for Performance

```sql
-- User lookups
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Ranking queries
CREATE INDEX idx_rankings_user_id ON rankings(user_id);
CREATE INDEX idx_rankings_category_id ON rankings(category_id);
CREATE INDEX idx_rankings_created_at ON rankings(created_at DESC);
CREATE INDEX idx_rankings_like_count ON rankings(like_count DESC);

-- Ranking items ordering
CREATE INDEX idx_ranking_items_ranking_position ON ranking_items(ranking_id, position);

-- Comments
CREATE INDEX idx_comments_ranking_id ON comments(ranking_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

-- Reactions
CREATE INDEX idx_reactions_target ON reactions(target_type, target_id);
CREATE INDEX idx_reactions_user_id ON reactions(user_id);

-- Follows
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
```

## Sample Data Structure

### Example Ranking: "Top 10 Basketball Players of All Time"
```json
{
  "ranking": {
    "id": "uuid-1",
    "user_id": "user-uuid",
    "category_id": "sports-uuid",
    "title": "Top 10 Basketball Players of All Time",
    "description": "My personal ranking based on skill, impact, and legacy",
    "is_public": true,
    "allow_comments": true
  },
  "items": [
    {
      "id": "item-uuid-1",
      "position": 1,
      "title": "Michael Jordan",
      "description": "6 championships, 5 MVPs, GOAT",
      "image_url": "https://...",
      "metadata": {
        "team": "Chicago Bulls",
        "era": "1980s-1990s",
        "stats": {"ppg": 30.1, "championships": 6}
      }
    },
    // ... more items
  ],
  "tags": ["basketball", "nba", "legends", "sports"],
  "comments": [
    {
      "id": "comment-uuid-1",
      "user_id": "other-user",
      "content": "LeBron should be #1! 🤔",
      "reactions": ["👍", "❤️", "😂"]
    }
  ]
}
```

## Database Choice Recommendation

For this app, I recommend **PostgreSQL** because:
- Excellent JSONB support for flexible metadata
- Strong consistency for social features
- Great performance with proper indexing
- Built-in full-text search capabilities
- Excellent for complex queries and relationships

Alternative: **Supabase** (PostgreSQL + real-time + auth) for rapid development.
