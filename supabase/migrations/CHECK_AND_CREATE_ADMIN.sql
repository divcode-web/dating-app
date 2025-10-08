-- ============================================
-- CHECK IF YOU HAVE AN ADMIN USER
-- ============================================

-- Step 1: Check all users in auth
SELECT
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- ============================================
-- Step 2: Check which users are admins
-- ============================================

SELECT
    au.id,
    u.email,
    au.role,
    au.permissions,
    au.created_at
FROM admin_users au
JOIN auth.users u ON au.id = u.id
ORDER BY au.created_at DESC;

-- ============================================
-- OPTION A: Make an existing user an admin
-- Replace 'your-email@example.com' with your actual email
-- ============================================

-- First, find your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then copy the ID and add to admin_users (replace the UUID below)
-- INSERT INTO admin_users (id, role, permissions)
-- VALUES ('paste-your-user-id-here', 'super_admin', ARRAY['all']);

-- ============================================
-- OPTION B: Create a brand new admin account
-- ============================================

-- If you don't have an account yet, you need to:
-- 1. Sign up through the app first at http://localhost:3002/auth
-- 2. Then come back and run the INSERT query above with your new user ID

-- ============================================
-- Verify your admin was added
-- ============================================

SELECT
    au.id,
    u.email,
    au.role,
    au.permissions
FROM admin_users au
JOIN auth.users u ON au.id = u.id
WHERE u.email = 'your-email@example.com';
