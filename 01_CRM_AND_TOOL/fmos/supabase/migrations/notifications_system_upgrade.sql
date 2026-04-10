-- Upgrade Notifications table for Task 8
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;

-- Update existing records with default type if any
UPDATE notifications SET type = 'system' WHERE type IS NULL;
ALTER TABLE notifications ALTER COLUMN type SET NOT NULL;

-- Ensure Realtime is enabled for notifications
-- Check if the publication exists first (standard Supabase setup usually has 'supabase_realtime')
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Table might already be in publication
        NULL;
END $$;

-- Policies are already set in rules_engine.sql, but we can refine them
-- Ensure users can only read/update their own
DROP POLICY IF EXISTS "Users read own notifications" ON notifications;
CREATE POLICY "Users read own notifications" ON notifications 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications" ON notifications 
FOR UPDATE USING (auth.uid() = user_id);

-- System can insert
DROP POLICY IF EXISTS "Engine inserts notifications" ON notifications;
CREATE POLICY "System inserts notifications" ON notifications 
FOR INSERT WITH CHECK (true);
