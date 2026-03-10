/*
  # Remove Unused Database Indexes - Final Cleanup

  1. Changes
    - Drop unused indexes that are not being utilized by queries
    - These indexes were identified by Supabase security scan as unused
    - Reduces database overhead and improves maintenance performance

  2. Indexes Being Removed
    - `idx_chat_history_user_id` on chat_history table
    - `idx_order_items_order_id` on order_items table
    - `idx_order_items_product_id` on order_items table
    - `idx_orders_user_id` on orders table
    - `idx_pets_user_id` on pets table

  3. Security Notes
    - Foreign key constraints remain intact for data integrity
    - RLS policies continue to protect data access
    - Indexes can be recreated if query patterns change in the future
*/

-- Remove unused index on chat_history table
DROP INDEX IF EXISTS idx_chat_history_user_id;

-- Remove unused indexes on order_items table
DROP INDEX IF EXISTS idx_order_items_order_id;
DROP INDEX IF EXISTS idx_order_items_product_id;

-- Remove unused index on orders table
DROP INDEX IF EXISTS idx_orders_user_id;

-- Remove unused index on pets table
DROP INDEX IF EXISTS idx_pets_user_id;
