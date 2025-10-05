-- ============================================
-- BLOG SYSTEM WITH PUBLIC ACCESS
-- ============================================
-- Public blog posts viewable without authentication
-- Admin-only content creation and management

-- ============================================
-- STEP 1: CREATE BLOG TABLES
-- ============================================

-- Blog Categories
CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#EC4899', -- Pink by default
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Blog Tags
CREATE TABLE IF NOT EXISTS blog_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Blog Posts
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT, -- Short summary for listing pages
    content TEXT NOT NULL, -- Full post content (markdown or HTML)
    featured_image TEXT, -- URL to featured image
    author_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,

    -- SEO fields
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT[],

    -- Status and visibility
    status TEXT DEFAULT 'draft', -- draft, published, archived
    is_featured BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,

    -- Engagement metrics
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Blog Post Tags (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS blog_post_tags (
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Blog Media/Assets
CREATE TABLE IF NOT EXISTS blog_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type TEXT NOT NULL, -- image, video, document
    alt_text TEXT,
    caption TEXT,
    file_size INTEGER, -- in bytes
    mime_type TEXT,
    uploaded_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Blog Comments (Optional - for user engagement)
CREATE TABLE IF NOT EXISTS blog_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE, -- For nested replies
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Blog Post Likes (Track who liked what)
CREATE TABLE IF NOT EXISTS blog_post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- ============================================
-- STEP 2: CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(is_featured);

CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON blog_tags(slug);

CREATE INDEX IF NOT EXISTS idx_blog_media_post ON blog_media(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_user ON blog_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_likes_post ON blog_post_likes(post_id);

-- ============================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_likes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: CREATE RLS POLICIES
-- ============================================

-- Blog Categories - Public read, admin write
CREATE POLICY "Anyone can view categories"
    ON blog_categories FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage categories"
    ON blog_categories FOR ALL
    USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Blog Tags - Public read, admin write
CREATE POLICY "Anyone can view tags"
    ON blog_tags FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage tags"
    ON blog_tags FOR ALL
    USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Blog Posts - Public read published posts, admin full access
CREATE POLICY "Anyone can view published posts"
    ON blog_posts FOR SELECT
    USING (status = 'published');

CREATE POLICY "Admins can view all posts"
    ON blog_posts FOR SELECT
    USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can create posts"
    ON blog_posts FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can update posts"
    ON blog_posts FOR UPDATE
    USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete posts"
    ON blog_posts FOR DELETE
    USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Blog Post Tags - Public read, admin write
CREATE POLICY "Anyone can view post tags"
    ON blog_post_tags FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage post tags"
    ON blog_post_tags FOR ALL
    USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Blog Media - Public read, admin write
CREATE POLICY "Anyone can view media"
    ON blog_media FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage media"
    ON blog_media FOR ALL
    USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Blog Comments - Users can comment, admins approve
CREATE POLICY "Anyone can view approved comments"
    ON blog_comments FOR SELECT
    USING (is_approved = true OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can create comments"
    ON blog_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
    ON blog_comments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all comments"
    ON blog_comments FOR ALL
    USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Blog Post Likes
CREATE POLICY "Anyone can view post likes"
    ON blog_post_likes FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can like posts"
    ON blog_post_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
    ON blog_post_likes FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- STEP 5: CREATE FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_post_views(post_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE blog_posts
    SET view_count = view_count + 1
    WHERE id = post_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle like on a post
CREATE OR REPLACE FUNCTION toggle_post_like(post_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    like_exists BOOLEAN;
BEGIN
    -- Check if like exists
    SELECT EXISTS (
        SELECT 1 FROM blog_post_likes
        WHERE post_id = post_uuid AND user_id = user_uuid
    ) INTO like_exists;

    IF like_exists THEN
        -- Unlike
        DELETE FROM blog_post_likes
        WHERE post_id = post_uuid AND user_id = user_uuid;

        UPDATE blog_posts
        SET like_count = like_count - 1
        WHERE id = post_uuid;

        RETURN FALSE;
    ELSE
        -- Like
        INSERT INTO blog_post_likes (post_id, user_id)
        VALUES (post_uuid, user_uuid);

        UPDATE blog_posts
        SET like_count = like_count + 1
        WHERE id = post_uuid;

        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 6: CREATE TRIGGERS
-- ============================================

CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_updated_at();

CREATE TRIGGER update_blog_categories_updated_at
    BEFORE UPDATE ON blog_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_updated_at();

CREATE TRIGGER update_blog_comments_updated_at
    BEFORE UPDATE ON blog_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_updated_at();

-- ============================================
-- STEP 7: INSERT DEFAULT DATA
-- ============================================

-- Default Categories
INSERT INTO blog_categories (name, slug, description, color) VALUES
    ('Dating Tips', 'dating-tips', 'Expert advice for successful dating', '#EC4899'),
    ('Relationships', 'relationships', 'Building and maintaining healthy relationships', '#8B5CF6'),
    ('Love Stories', 'love-stories', 'Real success stories from our community', '#F59E0B'),
    ('Safety & Privacy', 'safety-privacy', 'Stay safe while dating online', '#10B981'),
    ('App Updates', 'app-updates', 'Latest features and improvements', '#3B82F6')
ON CONFLICT (slug) DO NOTHING;

-- Default Tags
INSERT INTO blog_tags (name, slug) VALUES
    ('First Date', 'first-date'),
    ('Online Dating', 'online-dating'),
    ('Communication', 'communication'),
    ('Profile Tips', 'profile-tips'),
    ('Safety', 'safety'),
    ('Success Stories', 'success-stories'),
    ('Mental Health', 'mental-health'),
    ('Long Distance', 'long-distance'),
    ('Breakup Advice', 'breakup-advice'),
    ('Self Improvement', 'self-improvement')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- BLOG SYSTEM SETUP COMPLETE!
-- ============================================

COMMENT ON TABLE blog_posts IS 'Public blog posts - viewable without authentication when published';
COMMENT ON TABLE blog_categories IS 'Blog post categories';
COMMENT ON TABLE blog_tags IS 'Tags for blog posts (many-to-many)';
COMMENT ON TABLE blog_media IS 'Media assets attached to blog posts';
COMMENT ON TABLE blog_comments IS 'User comments on blog posts (requires moderation)';
COMMENT ON TABLE blog_post_likes IS 'Track which users liked which posts';
