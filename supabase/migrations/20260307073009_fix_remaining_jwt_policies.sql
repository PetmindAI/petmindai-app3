/*
  # Fix Remaining JWT-Based Policies

  ## Changes
  - Replace auth.jwt() checks in products table policies with user_profiles lookups
  - Replace auth.jwt() checks in orders table policies with user_profiles lookups
  - Replace auth.jwt() checks in order_items table policies with user_profiles lookups
  - Remove duplicate/conflicting policies

  This improves security by:
  1. Not relying on user_metadata which is editable by users
  2. Using the secure user_profiles table instead
  3. Preventing re-evaluation of auth functions for each row
*/

-- =====================================================
-- FIX PRODUCTS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admin users can insert products" ON public.products;
DROP POLICY IF EXISTS "Admin users can update products" ON public.products;
DROP POLICY IF EXISTS "Admin users can delete products" ON public.products;

CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  );

-- =====================================================
-- FIX ORDERS TABLE POLICIES (Remove old duplicates)
-- =====================================================

DROP POLICY IF EXISTS "Users and admins can view orders" ON public.orders;
DROP POLICY IF EXISTS "Users and admins can update orders" ON public.orders;

-- =====================================================
-- FIX ORDER_ITEMS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admin users can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Admin users can delete order items" ON public.order_items;

CREATE POLICY "Admins can update order items"
  ON public.order_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete order items"
  ON public.order_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  );

-- =====================================================
-- FIX CHAT_HISTORY DUPLICATE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can insert own chat history" ON public.chat_history;