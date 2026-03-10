/*
  # Add order_id and product_name columns to orders table

  1. Changes
    - Add `order_id` column (text) to store unique order identifier
    - Add `product_name` column (text) to store product name for quick reference
  
  2. Notes
    - Using IF NOT EXISTS to prevent errors if columns already exist
    - order_id will be populated with unique identifiers during order creation
    - product_name will store the first product name or concatenated product names
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'order_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'product_name'
  ) THEN
    ALTER TABLE orders ADD COLUMN product_name text;
  END IF;
END $$;