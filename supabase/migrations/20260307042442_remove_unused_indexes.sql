/*
  # Remove Unused Database Indexes

  1. Changes
    - Drop unused indexes that are not being utilized by queries
    - Keep foreign key constraints intact for referential integrity
    - Improves database maintenance and reduces overhead

  2. Indexes Removed
    - `idx_pets_user_id` - Not used in current query patterns
    - `idx_orders_user_id` - Not used in current query patterns  
    - `idx_orders_status` - Not used in current query patterns
    - `idx_orders_created_at` - Not used in current query patterns
    - `idx_order_items_order_id` - Not used in current query patterns
    - `idx_order_items_product_id` - Not used in current query patterns
    - `idx_chat_history_user_id` - Not used in current query patterns
    - `idx_chat_history_created_at` - Not used in current query patterns

  Note: If query patterns change and these indexes become necessary in the future,
  they can be recreated. Foreign key constraints remain intact for data integrity.
*/

-- Remove unused indexes on pets table
DROP INDEX IF EXISTS idx_pets_user_id;

-- Remove unused indexes on orders table
DROP INDEX IF EXISTS idx_orders_user_id;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_created_at;

-- Remove unused indexes on order_items table
DROP INDEX IF EXISTS idx_order_items_order_id;
DROP INDEX IF EXISTS idx_order_items_product_id;

-- Remove unused indexes on chat_history table
DROP INDEX IF EXISTS idx_chat_history_user_id;
DROP INDEX IF EXISTS idx_chat_history_created_at;
