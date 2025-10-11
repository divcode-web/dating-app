-- =====================================================
-- ADD READ RECEIPTS FEATURE
-- =====================================================
-- Implements read receipts for premium users
-- Basic+ tiers can see when messages are read
-- =====================================================

-- Function to mark message as read and set read_at timestamp
CREATE OR REPLACE FUNCTION mark_message_as_read(message_id UUID, reader_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE messages
  SET is_read = TRUE,
      read_at = NOW()
  WHERE id = message_id
    AND receiver_id = reader_id
    AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can see read receipts
CREATE OR REPLACE FUNCTION can_see_read_receipts(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier_id VARCHAR(50);
  has_receipts BOOLEAN;
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier_id INTO user_tier_id
  FROM user_profiles
  WHERE id = check_user_id;

  -- Default to free if no tier
  IF user_tier_id IS NULL THEN
    user_tier_id := 'free';
  END IF;

  -- Check if tier has read receipts feature
  SELECT has_read_receipts INTO has_receipts
  FROM subscription_tiers
  WHERE id = user_tier_id;

  RETURN COALESCE(has_receipts, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policy for read receipts
-- Users can only see read status if they have the feature
CREATE POLICY "Users can see read status with feature"
ON messages
FOR SELECT
USING (
  -- Can see own sent messages with read status if has feature
  (sender_id = auth.uid() AND can_see_read_receipts(auth.uid()))
  OR
  -- Can always see received messages
  receiver_id = auth.uid()
);

-- Index for faster read receipt queries
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at) WHERE read_at IS NOT NULL;

-- Grant permissions
GRANT EXECUTE ON FUNCTION mark_message_as_read TO authenticated;
GRANT EXECUTE ON FUNCTION can_see_read_receipts TO authenticated;
