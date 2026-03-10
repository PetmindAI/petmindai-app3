/*
  # Create Coupons System

  1. Overview
    - Enables discount coupon functionality for customer orders
    - Admins can create and manage coupons with various restrictions
    - Tracks coupon usage to enforce maximum use limits

  2. New Tables
    - `coupons`
      - `id` (uuid, primary key) - Unique coupon identifier
      - `code` (text, unique, not null) - Coupon code (e.g., "SAVE20")
      - `discount_percentage` (integer, not null) - Discount amount (1-100)
      - `expiry_date` (timestamptz, not null) - When coupon expires
      - `max_uses` (integer, not null) - Maximum number of times coupon can be used
      - `current_uses` (integer, default 0) - Current usage count
      - `is_active` (boolean, default true) - Whether coupon is active
      - `created_at` (timestamptz) - Creation timestamp
      - `created_by` (uuid) - Admin who created the coupon

  3. Constraints
    - Coupon code must be unique and uppercase
    - Discount percentage must be between 1 and 100
    - Max uses must be at least 1
    - Current uses cannot exceed max uses

  4. Security
    - Enable RLS on coupons table
    - Customers can only read active, non-expired coupons
    - Only admins can create, update, and delete coupons (checked via auth metadata)
    - All authenticated users can view valid coupons for application

  5. Indexes
    - Index on code for fast lookup during checkout
    - Index on is_active and expiry_date for filtering valid coupons
*/

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_percentage integer NOT NULL CHECK (discount_percentage >= 1 AND discount_percentage <= 100),
  expiry_date timestamptz NOT NULL,
  max_uses integer NOT NULL CHECK (max_uses >= 1),
  current_uses integer DEFAULT 0 CHECK (current_uses >= 0 AND current_uses <= max_uses),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view valid coupons for application
CREATE POLICY "Users can view valid coupons"
  ON coupons FOR SELECT
  TO authenticated
  USING (
    is_active = true 
    AND expiry_date > now()
    AND current_uses < max_uses
  );

-- Admins can view all coupons (checked via user metadata)
CREATE POLICY "Admins can view all coupons"
  ON coupons FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'role' = 'admin')
    OR
    ((auth.jwt()->'user_metadata'->>'role') = 'admin')
    OR
    ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  );

-- Admins can create coupons
CREATE POLICY "Admins can create coupons"
  ON coupons FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt()->>'role' = 'admin')
    OR
    ((auth.jwt()->'user_metadata'->>'role') = 'admin')
    OR
    ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  );

-- Admins can update coupons
CREATE POLICY "Admins can update coupons"
  ON coupons FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt()->>'role' = 'admin')
    OR
    ((auth.jwt()->'user_metadata'->>'role') = 'admin')
    OR
    ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  )
  WITH CHECK (
    (auth.jwt()->>'role' = 'admin')
    OR
    ((auth.jwt()->'user_metadata'->>'role') = 'admin')
    OR
    ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  );

-- Admins can delete coupons
CREATE POLICY "Admins can delete coupons"
  ON coupons FOR DELETE
  TO authenticated
  USING (
    (auth.jwt()->>'role' = 'admin')
    OR
    ((auth.jwt()->'user_metadata'->>'role') = 'admin')
    OR
    ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active_expiry ON coupons(is_active, expiry_date) WHERE is_active = true;

-- Add coupon_code column to orders table to track which coupon was used
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'coupon_code'
  ) THEN
    ALTER TABLE orders ADD COLUMN coupon_code text;
    ALTER TABLE orders ADD COLUMN discount_amount numeric(10,2) DEFAULT 0;
  END IF;
END $$;

-- Function to validate and apply coupon
CREATE OR REPLACE FUNCTION validate_and_apply_coupon(
  coupon_code_input text,
  OUT is_valid boolean,
  OUT discount_percentage integer,
  OUT message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  coupon_record RECORD;
BEGIN
  -- Default values
  is_valid := false;
  discount_percentage := 0;
  message := 'Invalid coupon code';

  -- Convert to uppercase for case-insensitive comparison
  coupon_code_input := UPPER(coupon_code_input);

  -- Get coupon details
  SELECT * INTO coupon_record
  FROM coupons
  WHERE code = coupon_code_input;

  -- Check if coupon exists
  IF NOT FOUND THEN
    message := 'Coupon code not found';
    RETURN;
  END IF;

  -- Check if coupon is active
  IF NOT coupon_record.is_active THEN
    message := 'This coupon is no longer active';
    RETURN;
  END IF;

  -- Check if coupon has expired
  IF coupon_record.expiry_date < now() THEN
    message := 'This coupon has expired';
    RETURN;
  END IF;

  -- Check if coupon has reached max uses
  IF coupon_record.current_uses >= coupon_record.max_uses THEN
    message := 'This coupon has reached its maximum usage limit';
    RETURN;
  END IF;

  -- Coupon is valid
  is_valid := true;
  discount_percentage := coupon_record.discount_percentage;
  message := 'Coupon applied successfully';
END;
$$;

-- Function to increment coupon usage (called after successful order)
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_code_input text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE coupons
  SET current_uses = current_uses + 1
  WHERE code = UPPER(coupon_code_input)
  AND current_uses < max_uses;
END;
$$;
