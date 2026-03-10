/*
  # Remove All Unused Indexes

  ## Summary
  This migration removes all unused database indexes that are consuming resources without providing performance benefits.

  ## Changes Made
  
  ### Removed Indexes
  1. `idx_chat_history_user_id` - Unused index on chat_history table
  2. `idx_order_items_order_id` - Unused index on order_items table
  3. `idx_order_items_product_id` - Unused index on order_items table
  4. `idx_orders_user_id` - Unused index on orders table
  5. `idx_pets_user_id` - Unused index on pets table
  6. `idx_order_items_order_product` - Unused composite index on order_items table

  ## Performance Impact
  Removing unused indexes will:
  - Reduce storage overhead
  - Improve write operation performance (INSERT, UPDATE, DELETE)
  - Simplify database maintenance
  
  ## Important Notes
  - These indexes were identified as unused through monitoring
  - Foreign key lookups will still work efficiently due to existing constraints
  - If query patterns change and these indexes become necessary, they can be re-added
*/

-- Drop unused index on chat_history table
DROP INDEX IF EXISTS idx_chat_history_user_id;

-- Drop unused indexes on order_items table
DROP INDEX IF EXISTS idx_order_items_order_id;
DROP INDEX IF EXISTS idx_order_items_product_id;
DROP INDEX IF EXISTS idx_order_items_order_product;

-- Drop unused index on orders table
DROP INDEX IF EXISTS idx_orders_user_id;

-- Drop unused index on pets table
DROP INDEX IF EXISTS idx_pets_user_id;