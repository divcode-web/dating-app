-- ============================================
-- CREATE YOUR ADMIN ACCOUNT
-- ============================================
-- Run this AFTER you've signed up through the app
-- ============================================

-- STEP 1: Find your user ID (replace 'your-email@example.com' with your actual email)
SELECT
    id as "Copy This UUID ⬇️",
    email,
    created_at
FROM auth.users
WHERE email = 'soyobipelumi@gmail.com';

-- ============================================
-- STEP 2: Copy the UUID from above and paste it in the command below
-- Remove the -- comment and replace 'paste-uuid-here' with your actual UUID
-- ============================================

INSERT INTO admin_users (id, role, permissions)
VALUES ('1f84c9f7-da65-4779-af99-ce772812c60c', 'super_admin', ARRAY['all']);

-- ============================================
-- EXAMPLE (don't use this, use your own UUID):
-- INSERT INTO admin_users (id, role, permissions)
-- VALUES ('1f84c9f7-da65-4779-af99-ce772812c60c', 'super_admin', ARRAY['all']);
-- ============================================

-- ============================================
-- STEP 3: Verify your admin account was created
-- ============================================
SELECT
    au.id,
    au.role,
    au.permissions,
    u.email,
    au.created_at
FROM admin_users au
JOIN auth.users u ON au.id = u.id
WHERE au.id = '1f84c9f7-da65-4779-af99-ce772812c60c';  -- Replace with your UUID

-- ============================================
-- OPTIONAL: Add another admin (if you're a super_admin)
-- ============================================
-- INSERT INTO admin_users (id, role, permissions, created_by)
-- VALUES (
--     'other-user-uuid-here',
--     'admin',  -- or 'super_admin'
--     ARRAY['view_reports', 'manage_verifications'],
--     'your-uuid-here'  -- Your UUID as the creator
-- );

-- ============================================
-- CLEANUP: Remove an admin (super_admin only)
-- ============================================
-- DELETE FROM admin_users WHERE id = 'admin-uuid-to-remove';

-- ============================================
-- VIEW ALL ADMINS
-- ============================================
SELECT
    au.id,
    u.email,
    au.role,
    au.permissions,
    au.created_at,
    creator.email as created_by_email
FROM admin_users au
JOIN auth.users u ON au.id = u.id
LEFT JOIN auth.users creator ON au.created_by = creator.id
ORDER BY au.created_at DESC;
