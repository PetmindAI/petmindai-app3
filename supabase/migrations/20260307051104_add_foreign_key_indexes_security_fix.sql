/*
  # Add Foreign Key Indexes for Performance

  1. Performance Improvements
    - Add index on `chat_history.user_id` for faster user chat lookups
    - Add index on `order_items.order_id` for faster order item queries
    - Add index on `order_items.product_id` for faster product lookup in orders
    - Add index on `orders.user_id` for faster user order queries
    - Add index on `pets.user_id` for faster user pet queries

  2. Security Enhancement
    - These indexes improve query performance and reduce database load
    - Prevents slow queries that could be exploited for DoS attacks
    - Ensures RLS policies perform efficiently

  3. Notes
    - All indexes are created with IF NOT EXISTS to ensure idempotency
    - Indexes are named following the pattern: idx_tablename_columnname
    - These indexes support the foreign key constraints already in place
*/

-- Add index for chat_history.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id 
ON chat_history(user_id);

-- Add index for order_items.order_id foreign key
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
ON order_items(order_id);

-- Add index for order_items.product_id foreign key
CREATE INDEX IF NOT EXISTS idx_order_items_product_id 
ON order_items(product_id);

-- Add index for orders.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_orders_user_id 
ON orders(user_id);

-- Add index for pets.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_pets_user_id 
ON pets(user_id);

-- Add composite index for order_items to optimize common query patterns
-- (queries that filter by both order_id and product_id)
CREATE INDEX IF NOT EXISTS idx_order_items_order_product 
ON order_items(order_id, product_id);
