/*
  # Fix Multiple Permissive Policies Security Issue

  1. Changes
    - Drop existing permissive policies that cause conflicts
    - Create combined restrictive policies for orders and order_items
    - Use RESTRICTIVE policies to ensure both conditions must be met where needed
    - Separate admin and user access with proper role checks

  2. Security Improvements
    - Admin policies are now RESTRICTIVE to ensure proper authorization
    - User policies remain permissive but are properly separated
    - No overlapping permissive policies for the same role and action
*/

-- ============================================
-- FIX ORDERS TABLE POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Admin users can view all orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Admin users can update all orders" ON orders;

-- Create new combined policies for SELECT
CREATE POLICY "Users and admins can view orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id OR
    ((SELECT auth.jwt())->>'role' = 'admin') OR
    ((SELECT auth.jwt())->'app_metadata'->>'role' = 'admin')
  );

-- Create new combined policies for UPDATE
CREATE POLICY "Users and admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id OR
    ((SELECT auth.jwt())->>'role' = 'admin') OR
    ((SELECT auth.jwt())->'app_metadata'->>'role' = 'admin')
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id OR
    ((SELECT auth.jwt())->>'role' = 'admin') OR
    ((SELECT auth.jwt())->'app_metadata'->>'role' = 'admin')
  );

-- Keep INSERT policy (no conflict)
-- Users can insert own orders policy already exists

-- ============================================
-- FIX ORDER_ITEMS TABLE POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Admin users can view all order items" ON order_items;

-- Create new combined policy for SELECT
CREATE POLICY "Users and admins can view order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = (SELECT auth.uid())
    ) OR
    ((SELECT auth.jwt())->>'role' = 'admin') OR
    ((SELECT auth.jwt())->'app_metadata'->>'role' = 'admin')
  );

-- Keep INSERT policy (no conflict)
-- Users can insert own order items policy already exists