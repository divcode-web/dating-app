-- Fix message update policy to allow users to mark received messages as read
-- Drop the old policy
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- Create new policy that allows:
-- 1. Senders to update their own messages
-- 2. Recipients to mark messages as read (update read_at field)
CREATE POLICY "Users can update messages in their matches"
    ON messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM matches
            WHERE matches.id = messages.match_id
            AND (matches.user_id_1 = auth.uid() OR matches.user_id_2 = auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM matches
            WHERE matches.id = messages.match_id
            AND (matches.user_id_1 = auth.uid() OR matches.user_id_2 = auth.uid())
        )
    );
