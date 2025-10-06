-- ============================================
-- ALLOW USER REPLIES TO ADMIN MESSAGES
-- ============================================
-- This migration allows users to send replies to admin messages
-- by allowing INSERT when admin_id is NULL (indicating user reply)

-- Add policy for users to insert replies
CREATE POLICY "Users can reply to admin messages"
    ON admin_messages FOR INSERT
    WITH CHECK (
        auth.uid() = recipient_id
        AND admin_id IS NULL
    );

COMMENT ON POLICY "Users can reply to admin messages" ON admin_messages IS 'Allows users to insert replies (admin_id=NULL) to admin conversations';
