/*
  # Add Customer Information to Orders Table

  1. Changes
    - Add `customer_name` column to orders table
    - Add `customer_email` column to orders table
    - Add `customer_phone` column to orders table
    - Update order status values to include: pending, processing, shipped, delivered, cancelled, paid
    - Add admin policies for order_items table

  2. Security
    - Admin users can view and manage all order items
    - Maintain existing user policies for their own orders

  3. Notes
    - Customer information will be captured from checkout form
    - Status field updated to match new workflow
    - "paid" status included for backward compatibility with existing orders
*/

-- Add customer information columns to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_phone text;
  END IF;
END $$;

-- Drop existing status constraint and add new one with updated values
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'paid'));

-- Drop existing admin policies for order_items if they exist
DROP POLICY IF EXISTS "Admin users can view all order items" ON order_items;
DROP POLICY IF EXISTS "Admin users can insert order items" ON order_items;
DROP POLICY IF EXISTS "Admin users can update order items" ON order_items;
DROP POLICY IF EXISTS "Admin users can delete order items" ON order_items;

-- Add admin policies for order_items table
CREATE POLICY "Admin users can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    ((SELECT auth.jwt())->>'role' = 'admin') OR
    ((SELECT auth.jwt())->'app_metadata'->>'role' = 'admin')
  );

CREATE POLICY "Admin users can insert order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    ((SELECT auth.jwt())->>'role' = 'admin') OR
    ((SELECT auth.jwt())->'app_metadata'->>'role' = 'admin')
  );

CREATE POLICY "Admin users can update order items"
  ON order_items FOR UPDATE
  TO authenticated
  USING (
    ((SELECT auth.jwt())->>'role' = 'admin') OR
    ((SELECT auth.jwt())->'app_metadata'->>'role' = 'admin')
  );

CREATE POLICY "Admin users can delete order items"
  ON order_items FOR DELETE
  TO authenticated
  USING (
    ((SELECT auth.jwt())->>'role' = 'admin') OR
    ((SELECT auth.jwt())->'app_metadata'->>'role' = 'admin')
  );