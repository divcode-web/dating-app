-- Add is_read column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Update existing messages to set is_read based on read_at
UPDATE messages SET is_read = TRUE WHERE read_at IS NOT NULL;
UPDATE messages SET is_read = FALSE WHERE read_at IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read, sender_id);
