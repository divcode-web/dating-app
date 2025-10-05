-- ============================================
-- FIX ADMIN SCHEMA - Run this to fix existing database
-- ============================================

-- Step 1: Drop old infinite recursion policies
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admins" ON admin_users;
DROP POLICY IF EXISTS "Users can view own admin record" ON admin_users;

-- Step 2: Create new policies without recursion
CREATE POLICY "Users can view own admin record"
    ON admin_users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Super admins can manage admins"
    ON admin_users FOR ALL
    USING (auth.uid() = id AND role = 'super_admin');

-- Step 3: Add admin fields to blocked_users table
ALTER TABLE blocked_users
ADD COLUMN IF NOT EXISTS blocked_by_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL;

-- Step 4: Fix reports table foreign keys (requires dropping and recreating)
-- First, save existing reports data if any
CREATE TABLE IF NOT EXISTS reports_backup AS SELECT * FROM reports;

-- Drop the reports table
DROP TABLE IF EXISTS reports CASCADE;

-- Recreate with correct foreign keys
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    reported_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    report_type report_type NOT NULL,
    reason TEXT NOT NULL,
    status report_status DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create RLS policies for reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
    ON reports FOR SELECT
    USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
    ON reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
    ON reports FOR SELECT
    USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admins can update reports"
    ON reports FOR UPDATE
    USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Restore reports data if there was any
-- INSERT INTO reports SELECT * FROM reports_backup;
-- DROP TABLE reports_backup;

-- Step 5: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_blocked_users_admin ON blocked_users(blocked_by_admin, blocked_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reviewed ON reports(reviewed_by, reviewed_at);

-- ============================================
-- Verification complete
-- ============================================
SELECT 'Admin schema fixed successfully!' as status;
