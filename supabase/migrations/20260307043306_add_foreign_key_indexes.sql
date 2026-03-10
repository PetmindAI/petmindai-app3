/*
  # Add Foreign Key Indexes for Performance Optimization

  ## Overview
  This migration adds indexes to all foreign key columns that were previously unindexed,
  significantly improving query performance for joins and lookups.

  ## Changes Made

  ### New Indexes
  1. **chat_history table**
     - `idx_chat_history_user_id` - Index on user_id foreign key
     - Improves performance when querying chat history by user

  2. **order_items table**
     - `idx_order_items_order_id` - Index on order_id foreign key
     - `idx_order_items_product_id` - Index on product_id foreign key
     - Improves performance when querying order items by order or product

  3. **orders table**
     - `idx_orders_user_id` - Index on user_id foreign key
     - Improves performance when querying orders by user

  4. **pets table**
     - `idx_pets_user_id` - Index on user_id foreign key
     - Improves performance when querying pets by user

  ## Performance Impact
  These indexes will significantly improve:
  - JOIN operations involving these foreign keys
  - WHERE clauses filtering by these columns
  - ORDER BY operations on these columns
  - Foreign key constraint checking

  ## Notes
  - All indexes use IF NOT EXISTS to allow safe rerunning of migration
  - Indexes are automatically maintained by PostgreSQL
  - No data changes are made, only performance optimizations
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