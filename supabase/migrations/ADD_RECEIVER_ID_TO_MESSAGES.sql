-- Add receiver_id column to messages table for direct messaging (admin support)
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);

-- Add composite index for admin message queries
CREATE INDEX IF NOT EXISTS idx_messages_admin_conversation
ON messages(sender_id, receiver_id, match_id)
WHERE match_id IS NULL;

COMMENT ON COLUMN messages.receiver_id IS 'Direct recipient (used for admin messages and direct messaging)';
