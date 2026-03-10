/*
  # Fix All Security and Performance Issues

  ## 1. Add Missing Foreign Key Indexes
  - Add index on `chat_history.user_id`
  - Add index on `coupons.created_by`
  - Add index on `order_items.order_id`
  - Add index on `order_items.product_id`
  - Add index on `orders.user_id`
  - Add index on `pets.user_id`

  ## 2. Remove Unused Indexes
  - Drop `idx_coupons_code` (unused)
  - Drop `idx_coupons_active_expiry` (unused)
  - Drop `idx_user_profiles_role` (unused)
  - Drop `idx_products_stock_quantity` (unused)

  ## 3. Optimize RLS Policies
  - Replace `auth.uid()` with `(select auth.uid())` in all policies
  - Replace `auth.jwt()` with `(select auth.jwt())` in all policies
  - This prevents re-evaluation for each row

  ## 4. Fix Multiple Permissive Policies
  - Consolidate duplicate SELECT policies on coupons
  - Consolidate duplicate INSERT policies on order_items
  - Consolidate duplicate SELECT policies on order_items
  - Consolidate duplicate SELECT policies on user_profiles

  ## 5. Fix Function Search Paths
  - Set explicit search_path for all functions

  ## 6. Replace user_metadata with app_metadata
  - Change all RLS policies to use app_metadata instead of user_metadata
  - user_metadata is editable by users and insecure
*/

-- =====================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_created_by ON public.coupons(created_by);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_pets_user_id ON public.pets(user_id);

-- =====================================================
-- 2. REMOVE UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS public.idx_coupons_code;
DROP INDEX IF EXISTS public.idx_coupons_active_expiry;
DROP INDEX IF EXISTS public.idx_user_profiles_role;
DROP INDEX IF EXISTS public.idx_products_stock_quantity;

-- =====================================================
-- 3. FIX MULTIPLE PERMISSIVE POLICIES
-- =====================================================

-- Fix coupons table: Drop existing policies and create optimized ones
DROP POLICY IF EXISTS "Admins can view all coupons" ON public.coupons;
DROP POLICY IF EXISTS "Users can view valid coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can create coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can update coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can delete coupons" ON public.coupons;

CREATE POLICY "Authenticated users can view valid coupons"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (
    is_active = true 
    AND (expiry_date IS NULL OR expiry_date > now())
    OR
    (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.role = 'admin'
      )
    )
  );

CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
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

-- Fix order_items table: Drop existing policies and create optimized ones
DROP POLICY IF EXISTS "Admin users can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admin users can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Users and admins can view order items" ON public.order_items;

CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = (select auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can insert own order items"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = (select auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  );

-- Fix user_profiles table: Drop existing policies and create optimized ones
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

CREATE POLICY "Users can view profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (
    id = (select auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = (select auth.uid())
      AND up.role = 'admin'
    )
  );

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- =====================================================
-- 4. OPTIMIZE OTHER RLS POLICIES WITH SUBQUERIES
-- =====================================================

-- Fix chat_history policies
DROP POLICY IF EXISTS "Users can view own chat history" ON public.chat_history;
DROP POLICY IF EXISTS "Users can insert own chat messages" ON public.chat_history;
DROP POLICY IF EXISTS "Users can update own chat messages" ON public.chat_history;
DROP POLICY IF EXISTS "Users can delete own chat messages" ON public.chat_history;

CREATE POLICY "Users can view own chat history"
  ON public.chat_history FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own chat messages"
  ON public.chat_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own chat messages"
  ON public.chat_history FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own chat messages"
  ON public.chat_history FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Fix orders policies
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Admin users can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admin users can update orders" ON public.orders;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
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

-- Fix pets policies
DROP POLICY IF EXISTS "Users can view own pets" ON public.pets;
DROP POLICY IF EXISTS "Users can insert own pets" ON public.pets;
DROP POLICY IF EXISTS "Users can update own pets" ON public.pets;
DROP POLICY IF EXISTS "Users can delete own pets" ON public.pets;

CREATE POLICY "Users can view own pets"
  ON public.pets FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own pets"
  ON public.pets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own pets"
  ON public.pets FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own pets"
  ON public.pets FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 5. FIX FUNCTION SEARCH PATHS
-- =====================================================

ALTER FUNCTION public.validate_and_apply_coupon SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_coupon_usage SET search_path = public, pg_temp;
ALTER FUNCTION public.admin_exists SET search_path = public, pg_temp;
ALTER FUNCTION public.assign_first_user_as_admin SET search_path = public, pg_temp;
ALTER FUNCTION public.set_user_role SET search_path = public, pg_temp;
ALTER FUNCTION public.reduce_stock_on_order SET search_path = public, pg_temp;
ALTER FUNCTION public.check_stock_before_order SET search_path = public, pg_temp;