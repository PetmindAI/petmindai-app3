/*
  # Update Orders Table for Razorpay Integration

  ## Summary
  Adds Razorpay payment fields and "paid" status to orders table for complete payment tracking.

  ## Changes Made
  
  ### 1. Updated Status Check Constraint
  - Added "paid" status to the allowed order statuses
  - Order statuses now include: pending, processing, paid, completed, cancelled
  - "paid" status indicates successful payment verification
  
  ### 2. Added Razorpay Payment Fields
  - `razorpay_order_id` - Stores the Razorpay order ID for reference
  - `razorpay_payment_id` - Stores the Razorpay payment ID for tracking
  - Both fields are TEXT type and nullable (only set after payment)

  ### 3. Updated shipping_address column
  - Changed from JSONB to TEXT for simpler address storage
  - Stores complete shipping address as a formatted string
  
  ## Important Notes
  - Uses safe IF NOT EXISTS checks to prevent errors on re-run
  - Preserves existing data and policies
  - Payment fields are optional until payment is completed
  - "paid" status should be set only after signature verification succeeds
*/

-- Drop the existing status constraint
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'orders' AND constraint_name LIKE '%status%check%'
  ) THEN
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
  END IF;
END $$;

-- Add new status constraint with "paid" status
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'processing', 'paid', 'completed', 'cancelled'));

-- Add razorpay_order_id column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'razorpay_order_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN razorpay_order_id text;
  END IF;
END $$;

-- Add razorpay_payment_id column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'razorpay_payment_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN razorpay_payment_id text;
  END IF;
END $$;

-- Update shipping_address to text if it's currently jsonb
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipping_address' AND data_type = 'jsonb'
  ) THEN
    ALTER TABLE orders ALTER COLUMN shipping_address TYPE text USING shipping_address::text;
  END IF;
END $$;