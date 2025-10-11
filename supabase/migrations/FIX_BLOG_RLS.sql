-- =====================================================
-- FIX BLOG TABLES RLS POLICIES
-- =====================================================
-- Ensures categories and tags are publicly readable
-- =====================================================

-- Enable RLS on blog tables if not already enabled
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view blog categories" ON blog_categories;
DROP POLICY IF EXISTS "Anyone can view blog tags" ON blog_tags;
DROP POLICY IF EXISTS "Anyone can view blog post tags" ON blog_post_tags;

-- Create public read policies for categories and tags
CREATE POLICY "Anyone can view blog categories"
  ON blog_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can view blog tags"
  ON blog_tags FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can view blog post tags"
  ON blog_post_tags FOR SELECT
  TO public
  USING (true);

-- Verify blog_posts has public read policy for published posts
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON blog_posts;
CREATE POLICY "Anyone can view published blog posts"
  ON blog_posts FOR SELECT
  TO public
  USING (status = 'published');
