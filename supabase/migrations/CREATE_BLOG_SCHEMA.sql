-- ============================================
-- BLOG SYSTEM SCHEMA
-- ============================================
-- Run this BEFORE INSERT_SAMPLE_BLOG_POSTS.sql
-- ============================================

-- Blog Categories Table
CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Blog Tags Table
CREATE TABLE IF NOT EXISTS blog_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image TEXT,
    author_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'draft', -- draft, published, archived
    published_at TIMESTAMP WITH TIME ZONE,
    views INTEGER DEFAULT 0,
    meta_title TEXT,
    meta_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Blog Post Tags (Many-to-Many)
CREATE TABLE IF NOT EXISTS blog_post_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, tag_id)
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_post ON blog_post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag ON blog_post_tags(tag_id);

-- Enable RLS
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view categories" ON blog_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON blog_categories;
DROP POLICY IF EXISTS "Anyone can view tags" ON blog_tags;
DROP POLICY IF EXISTS "Admins can manage tags" ON blog_tags;
DROP POLICY IF EXISTS "Anyone can view published posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can manage posts" ON blog_posts;
DROP POLICY IF EXISTS "Anyone can view post tags" ON blog_post_tags;
DROP POLICY IF EXISTS "Admins can manage post tags" ON blog_post_tags;

-- RLS Policies for Categories
CREATE POLICY "Anyone can view categories"
    ON blog_categories FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage categories"
    ON blog_categories FOR ALL
    USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- RLS Policies for Tags
CREATE POLICY "Anyone can view tags"
    ON blog_tags FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage tags"
    ON blog_tags FOR ALL
    USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- RLS Policies for Posts
CREATE POLICY "Anyone can view published posts"
    ON blog_posts FOR SELECT
    USING (status = 'published' OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage posts"
    ON blog_posts FOR ALL
    USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- RLS Policies for Post Tags
CREATE POLICY "Anyone can view post tags"
    ON blog_post_tags FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage post tags"
    ON blog_post_tags FOR ALL
    USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_blog_categories_updated_at ON blog_categories;
CREATE TRIGGER update_blog_categories_updated_at
    BEFORE UPDATE ON blog_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert Default Categories
INSERT INTO blog_categories (name, slug, description) VALUES
    ('Dating Tips', 'dating-tips', 'Expert advice on dating, relationships, and finding love'),
    ('Love Stories', 'love-stories', 'Real success stories from our community'),
    ('Safety & Privacy', 'safety-privacy', 'Tips for staying safe while dating online'),
    ('Relationship Advice', 'relationship-advice', 'Building and maintaining healthy relationships')
ON CONFLICT (slug) DO NOTHING;

-- Insert Default Tags
INSERT INTO blog_tags (name, slug) VALUES
    ('First Date', 'first-date'),
    ('Profile Tips', 'profile-tips'),
    ('Online Dating', 'online-dating'),
    ('Success Stories', 'success-stories'),
    ('Safety', 'safety'),
    ('Relationship Goals', 'relationship-goals'),
    ('Communication', 'communication'),
    ('Self Improvement', 'self-improvement')
ON CONFLICT (slug) DO NOTHING;

-- Success message
SELECT 'Blog schema created successfully!' as status;
