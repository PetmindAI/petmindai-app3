/*
  # Optimize RLS Policies for Performance and Security

  1. Performance Optimizations
    - Wrap auth function calls in SELECT subqueries to prevent re-evaluation per row
    - This significantly improves query performance at scale
    - Applies to all RLS policies on products and user_profiles tables

  2. Index Cleanup
    - Remove unused indexes on user_profiles table
    - idx_user_profiles_email and idx_user_profiles_provider are not utilized
    - Reduces database storage and maintenance overhead

  3. Security Improvements
    - Fix function search_path security issue in update_updated_at_column
    - Set explicit search_path to prevent injection attacks
    - Make function SECURITY DEFINER safe

  4. Tables Modified
    - `products` - All admin RLS policies optimized
    - `user_profiles` - All user RLS policies optimized, unused indexes removed
    - `update_updated_at_column` function - Security hardened

  5. Changes Applied
    - Replace auth.uid() with (SELECT auth.uid())
    - Replace auth.jwt() with (SELECT auth.jwt())
    - Drop unused indexes
    - Add SECURITY DEFINER and search_path to trigger function
*/

-- ============================================================================
-- PRODUCTS TABLE: Optimize RLS Policies
-- ============================================================================

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admin users can insert products" ON products;
DROP POLICY IF EXISTS "Admin users can update products" ON products;
DROP POLICY IF EXISTS "Admin users can delete products" ON products;

-- Create optimized policies with SELECT subqueries
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

-- ============================================================================
-- USER_PROFILES TABLE: Optimize RLS Policies
-- ============================================================================

-- Drop existing user profile policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;

-- Create optimized policies with SELECT subqueries
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

-- ============================================================================
-- INDEX CLEANUP: Remove Unused Indexes
-- ============================================================================

-- Remove unused email index (not used in queries)
DROP INDEX IF EXISTS idx_user_profiles_email;

-- Remove unused provider index (not used in queries)
DROP INDEX IF EXISTS idx_user_profiles_provider;

-- ============================================================================
-- FUNCTION SECURITY: Fix Search Path Vulnerability
-- ============================================================================

-- Recreate the function with proper security settings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;