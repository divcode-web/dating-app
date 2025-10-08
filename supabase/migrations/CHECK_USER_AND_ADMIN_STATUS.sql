-- Run this SQL in Supabase SQL Editor to check user status

-- 1. Check if user exists in auth.users
SELECT
  id,
  email,
  created_at,
  last_sign_in_at,
  confirmed_at
FROM auth.users
WHERE email = 'dorrelldiana@gmail.com';

-- 2. Check if user is in admin_users table
SELECT
  au.id,
  au.role,
  au.permissions,
  au.created_at,
  u.email
FROM admin_users au
JOIN auth.users u ON au.id = u.id
WHERE u.email = 'dorrelldiana@gmail.com';

-- 3. Check account_deletions to see if this email was deleted
SELECT
  user_id,
  email,
  deletion_category,
  deletion_reason,
  deleted_at
FROM account_deletions
WHERE email = 'dorrelldiana@gmail.com'
ORDER BY deleted_at DESC;

-- 4. If user exists but NOT in admin_users, add them:
-- First, get the user ID from query #1, then run:
/*
INSERT INTO admin_users (id, role, permissions)
VALUES ('USER_ID_FROM_QUERY_1', 'super_admin', ARRAY['all'])
ON CONFLICT (id) DO UPDATE
SET role = 'super_admin', permissions = ARRAY['all'];
*/

-- 5. Verify the admin was added successfully
SELECT
  au.id,
  u.email,
  au.role,
  au.permissions
FROM admin_users au
JOIN auth.users u ON au.id = u.id
WHERE u.email = 'dorrelldiana@gmail.com';
