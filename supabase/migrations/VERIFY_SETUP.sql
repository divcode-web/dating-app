-- ============================================
-- VERIFY YOUR SETUP IS COMPLETE
-- ============================================
-- Run this after COMPLETE_RESET.sql to verify everything was created correctly
-- ============================================

-- ============================================
-- 1. CHECK ALL TABLES EXIST
-- ============================================
SELECT
    'Tables Check' as check_type,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) >= 10 THEN '✅ PASS'
        ELSE '❌ FAIL - Missing tables'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'user_profiles',
    'user_settings',
    'likes',
    'matches',
    'messages',
    'subscriptions',
    'message_limits',
    'blocked_users',
    'reports',
    'admin_users'
);

-- ============================================
-- 2. CHECK VERIFICATION COLUMNS EXIST
-- ============================================
SELECT
    'Verification Columns' as check_type,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) >= 4 THEN '✅ PASS'
        ELSE '❌ FAIL - Missing columns'
    END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_profiles'
AND column_name IN (
    'is_verified',
    'verification_status',
    'verification_video_url',
    'verification_submitted_at'
);

-- ============================================
-- 3. CHECK ADMIN TABLE EXISTS AND HAS CORRECT COLUMNS
-- ============================================
SELECT
    'Admin Users Table' as check_type,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) >= 4 THEN '✅ PASS'
        ELSE '❌ FAIL - Missing admin columns'
    END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'admin_users'
AND column_name IN ('id', 'role', 'permissions', 'created_by');

-- ============================================
-- 4. CHECK EXTENDED PROFILE FIELDS EXIST
-- ============================================
SELECT
    'Extended Profile Fields' as check_type,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) >= 10 THEN '✅ PASS'
        ELSE '❌ FAIL - Missing optional fields'
    END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_profiles'
AND column_name IN (
    'ethnicity',
    'height',
    'education',
    'occupation',
    'smoking',
    'drinking',
    'religion',
    'relationship_type',
    'looking_for',
    'languages',
    'children'
);

-- ============================================
-- 5. CHECK FUNCTIONS EXIST
-- ============================================
SELECT
    'Functions' as check_type,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) >= 2 THEN '✅ PASS'
        ELSE '❌ FAIL - Missing functions'
    END as status
FROM pg_proc
WHERE proname IN (
    'calculate_profile_completion',
    'check_message_limit',
    'cleanup_old_messages'
);

-- ============================================
-- 6. CHECK RLS IS ENABLED
-- ============================================
SELECT
    'RLS Enabled' as check_type,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) >= 10 THEN '✅ PASS'
        ELSE '❌ FAIL - RLS not enabled on all tables'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
AND tablename IN (
    'user_profiles',
    'user_settings',
    'likes',
    'matches',
    'messages',
    'subscriptions',
    'message_limits',
    'blocked_users',
    'reports',
    'admin_users'
);

-- ============================================
-- 7. CHECK ADMIN POLICIES EXIST
-- ============================================
SELECT
    'Admin Policies' as check_type,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) >= 2 THEN '✅ PASS'
        ELSE '❌ FAIL - Missing admin policies'
    END as status
FROM pg_policies
WHERE tablename IN ('reports', 'admin_users')
AND policyname LIKE '%admin%';

-- ============================================
-- 8. CHECK MESSAGE LIMIT TRIGGER EXISTS
-- ============================================
SELECT
    'Message Limit Trigger' as check_type,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) >= 1 THEN '✅ PASS'
        ELSE '❌ FAIL - Message limit trigger not found'
    END as status
FROM pg_trigger
WHERE tgname = 'check_message_limit_trigger';

-- ============================================
-- 9. CHECK SUBSCRIPTION TYPES EXIST
-- ============================================
SELECT
    'Subscription Plans' as check_type,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) >= 4 THEN '✅ PASS'
        ELSE '❌ FAIL - Subscription enum incomplete'
    END as status
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'subscription_plan';

-- ============================================
-- 10. CHECK REPORT TYPES EXIST
-- ============================================
SELECT
    'Report Types' as check_type,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) >= 5 THEN '✅ PASS'
        ELSE '❌ FAIL - Report types incomplete'
    END as status
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'report_type';

-- ============================================
-- DETAILED TABLE LIST
-- ============================================
SELECT
    table_name,
    '✅ Created' as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'user_profiles',
    'user_settings',
    'likes',
    'matches',
    'messages',
    'subscriptions',
    'message_limits',
    'blocked_users',
    'reports',
    'admin_users'
)
ORDER BY table_name;

-- ============================================
-- LIST ALL FUNCTIONS CREATED
-- ============================================
SELECT
    proname as function_name,
    '✅ Created' as status
FROM pg_proc
WHERE proname IN (
    'calculate_profile_completion',
    'check_message_limit',
    'cleanup_old_messages',
    'update_updated_at_column',
    'update_last_active'
)
ORDER BY proname;

-- ============================================
-- CHECK ADMIN USERS (should be empty initially)
-- ============================================
SELECT
    CASE
        WHEN COUNT(*) = 0 THEN 'No admins yet - Create your admin account next!'
        ELSE CONCAT(COUNT(*)::text, ' admin(s) found')
    END as admin_status
FROM admin_users;

-- ============================================
-- FINAL SUMMARY
-- ============================================
SELECT
    '🎉 SETUP VERIFICATION COMPLETE' as message,
    'Check all results above - all should show ✅ PASS' as instruction,
    'If any show ❌ FAIL, re-run COMPLETE_RESET.sql' as troubleshooting;

-- ============================================
-- NEXT STEPS
-- ============================================
SELECT
    'NEXT STEPS:' as heading,
    '1. Create storage bucket: profile-photos (PUBLIC)' as step_1,
    '2. Run STORAGE_POLICIES.sql' as step_2,
    '3. Run CREATE_ADMIN.sql to create your admin account' as step_3,
    '4. Test admin login at /admin/login' as step_4,
    '5. Test user features at /profile/verify' as step_5;
