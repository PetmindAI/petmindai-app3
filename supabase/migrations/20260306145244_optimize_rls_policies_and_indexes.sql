/*
  # Optimize RLS Policies and Database Performance

  1. Performance Optimization
    - Replace auth.uid() and auth.jwt() with (SELECT auth.uid()) and (SELECT auth.jwt())
    - This prevents re-evaluation of auth functions for each row, improving query performance
    - Recreate all RLS policies for products and user_profiles tables

  2. Index Cleanup
    - Remove unused indexes on user_profiles table (email, provider)
    - These indexes are not being used by queries and add overhead

  3. Function Security
    - Fix update_updated_at_column function to have immutable search_path
    - Prevents security issues with search_path manipulation

  4. Tables Affected
    - products: Recreate 3 admin policies with optimized auth checks
    - user_profiles: Recreate 4 user policies with optimized auth checks

  5. Security Notes
    - All existing security rules are maintained
    - Only performance optimization, no permission changes
    - Admin role checking remains the same for products
    - User ownership checking remains the same for profiles
*/

-- ============================================
-- OPTIMIZE PRODUCTS TABLE RLS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admin users can insert products" ON products;
DROP POLICY IF EXISTS "Admin users can update products" ON products;
DROP POLICY IF EXISTS "Admin users can delete products" ON products;

-- Recreate policies with optimized auth function calls
CREATE POLICY "Admin users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    ((SELECT auth.jwt())->>'role' = 'admin') OR
    ((SELECT auth.jwt())->'app_metadata'->>'role' = 'admin')
  );

CREATE POLICY "Admin users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    ((SELECT auth.jwt())->>'role' = 'admin') OR
    ((SELECT auth.jwt())->'app_metadata'->>'role' = 'admin')
  )
  WITH CHECK (
    ((SELECT auth.jwt())->>'role' = 'admin') OR
    ((SELECT auth.jwt())->'app_metadata'->>'role' = 'admin')
  );

CREATE POLICY "Admin users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    ((SELECT auth.jwt())->>'role' = 'admin') OR
    ((SELECT auth.jwt())->'app_metadata'->>'role' = 'admin')
  );

-- ============================================
-- OPTIMIZE USER_PROFILES TABLE RLS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;

-- Recreate policies with optimized auth function calls
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can delete own profile"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- ============================================
-- REMOVE UNUSED INDEXES
-- ============================================

-- Drop unused indexes on user_profiles table
DROP INDEX IF EXISTS idx_user_profiles_email;
DROP INDEX IF EXISTS idx_user_profiles_provider;

-- ============================================
-- FIX FUNCTION SECURITY
-- ============================================

-- Recreate update_updated_at_column function with secure search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;