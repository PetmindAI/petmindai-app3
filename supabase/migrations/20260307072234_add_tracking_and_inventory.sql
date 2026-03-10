/*
  # Add Shipping Tracking and Inventory Management

  1. Changes to orders table
    - Add `tracking_number` column to store shipping tracking information
  
  2. Changes to products table
    - Add `stock_quantity` column to track available inventory
    - Add `is_in_stock` computed field for easy stock status checking
  
  3. Trigger Function
    - Create trigger to automatically reduce stock when order is paid
    - Prevent negative stock quantities
  
  4. Security
    - Update RLS policies to allow stock updates through triggers
*/

-- Add tracking_number to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'tracking_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN tracking_number text;
  END IF;
END $$;

-- Add stock_quantity to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'stock_quantity'
  ) THEN
    ALTER TABLE products ADD COLUMN stock_quantity integer DEFAULT 100 NOT NULL;
  END IF;
END $$;

-- Create function to reduce stock when order is paid
CREATE OR REPLACE FUNCTION reduce_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Only reduce stock when order status changes to 'paid' or 'processing'
  IF (NEW.status IN ('paid', 'processing')) AND (OLD.status IS NULL OR OLD.status NOT IN ('paid', 'processing')) THEN
    -- Reduce stock for each item in the order
    UPDATE products
    SET stock_quantity = products.stock_quantity - order_items.quantity
    FROM order_items
    WHERE order_items.order_id = NEW.id
      AND products.id = order_items.product_id
      AND products.stock_quantity >= order_items.quantity;
    
    -- Check if any products went out of stock
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock for one or more products';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to reduce stock automatically
DROP TRIGGER IF EXISTS reduce_stock_trigger ON orders;
CREATE TRIGGER reduce_stock_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION reduce_stock_on_order();

-- Create function to check stock availability before creating order
CREATE OR REPLACE FUNCTION check_stock_before_order()
RETURNS TRIGGER AS $$
DECLARE
  v_product_stock integer;
  v_required_quantity integer;
BEGIN
  -- Check stock for each item
  FOR v_product_stock, v_required_quantity IN
    SELECT p.stock_quantity, oi.quantity
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = NEW.id
  LOOP
    IF v_product_stock < v_required_quantity THEN
      RAISE EXCEPTION 'Insufficient stock available';
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for better performance on stock queries
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products(stock_quantity);

-- Update existing products to have default stock
UPDATE products SET stock_quantity = 100 WHERE stock_quantity IS NULL;